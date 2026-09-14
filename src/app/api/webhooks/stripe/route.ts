import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { isActiveSubscriptionStatus, isStripeConfigured, stripeClient } from "@/lib/stripe";

/**
 * Stripe webhook — the single source of truth for `User.isPro`. Every event
 * handled here re-derives isPro from the subscription's *current* status
 * rather than trusting the event type alone, so out-of-order delivery (Stripe
 * doesn't guarantee ordering) can't leave a stale isPro value.
 *
 * Auth-free by necessity (Stripe calls this directly); authenticity comes from
 * the signature check below, not a session. Do not add IP rate limiting here —
 * Stripe's source IPs are shared/dynamic and it already retries on non-2xx.
 */
export async function POST(request: Request) {
  if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = stripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        if (checkoutSession.mode === "subscription" && checkoutSession.subscription) {
          await syncSubscription(
            typeof checkoutSession.subscription === "string"
              ? checkoutSession.subscription
              : checkoutSession.subscription.id,
            checkoutSession.customer,
          );
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscription(subscription.id, subscription.customer);
        break;
      }
      default:
        // Unhandled event types are ignored, not errored — Stripe sends many
        // event types we don't act on (invoices, payment methods, etc.).
        break;
    }
  } catch (error) {
    console.error(`Stripe webhook handler failed for ${event.type}:`, error);
    // 500 so Stripe retries — an isPro sync failure should not be silently dropped.
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/**
 * Re-fetches the subscription from Stripe (rather than trusting the event
 * payload alone) and writes isPro + stripeSubscriptionId from its *current*
 * state — makes the handler idempotent and safe against out-of-order events.
 */
async function syncSubscription(
  subscriptionId: string,
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
): Promise<void> {
  const customerId = typeof customer === "string" ? customer : customer?.id;
  if (!customerId) return;

  const stripe = stripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const active = isActiveSubscriptionStatus(subscription.status);

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });

  if (!user) {
    // No matching user (e.g. a test-mode event against a stale customer) —
    // nothing to sync, not an error.
    console.warn(`Stripe webhook: no user for customer ${customerId}`);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isPro: active,
      stripeSubscriptionId: active ? subscription.id : null,
    },
  });
}
