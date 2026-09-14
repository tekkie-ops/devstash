import Stripe from "stripe";

/**
 * Lazy Stripe client singleton, mirroring src/lib/r2.ts's pattern. Empty when
 * unconfigured — callers should 503 (API routes) or return a friendly error
 * (Server Actions) rather than let the SDK throw on a missing key.
 */
let client: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function stripeClient(): Stripe {
  if (!client) {
    const secretKey = process.env.STRIPE_SECRET_KEY ?? "";
    client = new Stripe(secretKey);
  }
  return client;
}

/** Billing-cycle keys used throughout the app instead of raw Stripe price ids. */
export const PLAN_INTERVALS = ["monthly", "yearly"] as const;
export type PlanInterval = (typeof PLAN_INTERVALS)[number];

export function priceIdFor(interval: PlanInterval): string {
  const id =
    interval === "monthly"
      ? process.env.STRIPE_PRICE_ID_MONTHLY
      : process.env.STRIPE_PRICE_ID_YEARLY;

  if (!id) {
    throw new Error(`Missing Stripe price id for interval "${interval}"`);
  }
  return id;
}

/**
 * Stripe subscription statuses that should be treated as "Pro" access. Trialing
 * counts as Pro (per Stripe's own recommendation); past_due deliberately does
 * NOT — a lapsed payment should not keep Pro access.
 */
const ACTIVE_STATUSES = new Set<Stripe.Subscription.Status>([
  "active",
  "trialing",
]);

export function isActiveSubscriptionStatus(
  status: Stripe.Subscription.Status,
): boolean {
  return ACTIVE_STATUSES.has(status);
}
