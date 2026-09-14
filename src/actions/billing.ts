"use server";

import { headers } from "next/headers";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  isStripeConfigured,
  priceIdFor,
  stripeClient,
  type PlanInterval,
} from "@/lib/stripe";

export type CheckoutResult =
  | { success: true; url: string }
  | { success: false; error: string };

export type PortalResult =
  | { success: true; url: string }
  | { success: false; error: string };

/** Reads the request's own origin instead of adding a base-URL env var — same approach `register/route.ts` uses for its verification link. */
async function getOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

/**
 * Starts a Stripe Checkout session for the signed-in user to subscribe to
 * DevStash Pro. Creates (and persists) a Stripe Customer on first use so a
 * returning user reuses the same customer instead of accumulating duplicates.
 * The webhook, not this action, is the source of truth for isPro — this only
 * gets the user to Stripe's hosted page.
 */
export async function createCheckoutSession(
  interval: PlanInterval,
): Promise<CheckoutResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to do that" };
  }

  if (!isStripeConfigured()) {
    return { success: false, error: "Billing is not configured" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, stripeCustomerId: true, isPro: true },
  });

  if (!user) {
    return { success: false, error: "Account not found" };
  }

  if (user.isPro) {
    return { success: false, error: "You already have a Pro subscription" };
  }

  const stripe = stripeClient();
  const origin = await getOrigin();

  try {
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceIdFor(interval), quantity: 1 }],
      success_url: `${origin}/settings?checkout=success`,
      cancel_url: `${origin}/settings?checkout=canceled`,
      metadata: { userId: user.id },
      subscription_data: { metadata: { userId: user.id } },
    });

    if (!checkoutSession.url) {
      return { success: false, error: "Couldn't start checkout. Please try again." };
    }

    return { success: true, url: checkoutSession.url };
  } catch (error) {
    console.error("createCheckoutSession failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Opens Stripe's hosted Billing Portal so a Pro user can update payment
 * details, switch plans, or cancel — no custom cancel/upgrade UI needed.
 */
export async function createBillingPortalSession(): Promise<PortalResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to do that" };
  }

  if (!isStripeConfigured()) {
    return { success: false, error: "Billing is not configured" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    return { success: false, error: "No billing account found" };
  }

  const stripe = stripeClient();
  const origin = await getOrigin();

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${origin}/settings`,
    });

    return { success: true, url: portalSession.url };
  } catch (error) {
    console.error("createBillingPortalSession failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
