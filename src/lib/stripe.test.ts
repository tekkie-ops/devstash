import { afterEach, describe, expect, it } from "vitest";

import { isActiveSubscriptionStatus, priceIdFor } from "@/lib/stripe";

describe("isActiveSubscriptionStatus", () => {
  it("treats active and trialing as Pro", () => {
    expect(isActiveSubscriptionStatus("active")).toBe(true);
    expect(isActiveSubscriptionStatus("trialing")).toBe(true);
  });

  it("does not treat past_due, canceled, unpaid, or incomplete_expired as Pro", () => {
    expect(isActiveSubscriptionStatus("past_due")).toBe(false);
    expect(isActiveSubscriptionStatus("canceled")).toBe(false);
    expect(isActiveSubscriptionStatus("unpaid")).toBe(false);
    expect(isActiveSubscriptionStatus("incomplete_expired")).toBe(false);
  });
});

describe("priceIdFor", () => {
  const originalMonthly = process.env.STRIPE_PRICE_ID_MONTHLY;
  const originalYearly = process.env.STRIPE_PRICE_ID_YEARLY;

  afterEach(() => {
    if (originalMonthly === undefined) {
      delete process.env.STRIPE_PRICE_ID_MONTHLY;
    } else {
      process.env.STRIPE_PRICE_ID_MONTHLY = originalMonthly;
    }
    if (originalYearly === undefined) {
      delete process.env.STRIPE_PRICE_ID_YEARLY;
    } else {
      process.env.STRIPE_PRICE_ID_YEARLY = originalYearly;
    }
  });

  it("throws when the monthly price id is unset", () => {
    delete process.env.STRIPE_PRICE_ID_MONTHLY;
    expect(() => priceIdFor("monthly")).toThrow(
      'Missing Stripe price id for interval "monthly"',
    );
  });

  it("throws when the yearly price id is unset", () => {
    delete process.env.STRIPE_PRICE_ID_YEARLY;
    expect(() => priceIdFor("yearly")).toThrow(
      'Missing Stripe price id for interval "yearly"',
    );
  });

  it("returns the configured price id", () => {
    process.env.STRIPE_PRICE_ID_MONTHLY = "price_monthly_123";
    expect(priceIdFor("monthly")).toBe("price_monthly_123");
  });
});
