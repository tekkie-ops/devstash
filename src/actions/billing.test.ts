import { beforeEach, describe, expect, it, vi } from "vitest";

import { createBillingPortalSession, createCheckoutSession } from "@/actions/billing";

const {
  authMock,
  findUniqueMock,
  updateMock,
  isStripeConfiguredMock,
  priceIdForMock,
  customersCreateMock,
  checkoutSessionsCreateMock,
  billingPortalSessionsCreateMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  findUniqueMock: vi.fn(),
  updateMock: vi.fn(),
  isStripeConfiguredMock: vi.fn(),
  priceIdForMock: vi.fn(),
  customersCreateMock: vi.fn(),
  checkoutSessionsCreateMock: vi.fn(),
  billingPortalSessionsCreateMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: findUniqueMock,
      update: updateMock,
    },
  },
}));

vi.mock("@/lib/stripe", () => ({
  isStripeConfigured: isStripeConfiguredMock,
  priceIdFor: priceIdForMock,
  stripeClient: () => ({
    customers: { create: customersCreateMock },
    checkout: { sessions: { create: checkoutSessionsCreateMock } },
    billingPortal: { sessions: { create: billingPortalSessionsCreateMock } },
  }),
}));

vi.mock("next/headers", () => ({
  headers: async () =>
    new Map([
      ["host", "localhost:3000"],
      ["x-forwarded-proto", "http"],
    ]),
}));

beforeEach(() => {
  authMock.mockReset();
  findUniqueMock.mockReset();
  updateMock.mockReset();
  isStripeConfiguredMock.mockReset();
  priceIdForMock.mockReset();
  customersCreateMock.mockReset();
  checkoutSessionsCreateMock.mockReset();
  billingPortalSessionsCreateMock.mockReset();

  authMock.mockResolvedValue({ user: { id: "user-1" } });
  isStripeConfiguredMock.mockReturnValue(true);
  priceIdForMock.mockReturnValue("price_123");
});

describe("createCheckoutSession", () => {
  it("rejects an unauthenticated caller before touching Stripe", async () => {
    authMock.mockResolvedValue(null);

    const result = await createCheckoutSession("monthly");

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to do that",
    });
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("rejects when Stripe isn't configured", async () => {
    isStripeConfiguredMock.mockReturnValue(false);

    const result = await createCheckoutSession("monthly");

    expect(result).toEqual({ success: false, error: "Billing is not configured" });
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("rejects a user who already has Pro", async () => {
    findUniqueMock.mockResolvedValue({
      id: "user-1",
      email: "demo@devstash.io",
      stripeCustomerId: null,
      isPro: true,
    });

    const result = await createCheckoutSession("monthly");

    expect(result).toEqual({
      success: false,
      error: "You already have a Pro subscription",
    });
    expect(checkoutSessionsCreateMock).not.toHaveBeenCalled();
  });

  it("creates and persists a Stripe customer on first use", async () => {
    findUniqueMock.mockResolvedValue({
      id: "user-1",
      email: "demo@devstash.io",
      stripeCustomerId: null,
      isPro: false,
    });
    customersCreateMock.mockResolvedValue({ id: "cus_new" });
    checkoutSessionsCreateMock.mockResolvedValue({ url: "https://checkout.stripe.com/session" });

    const result = await createCheckoutSession("monthly");

    expect(customersCreateMock).toHaveBeenCalledWith({
      email: "demo@devstash.io",
      metadata: { userId: "user-1" },
    });
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { stripeCustomerId: "cus_new" },
    });
    expect(checkoutSessionsCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_new" }),
    );
    expect(result).toEqual({ success: true, url: "https://checkout.stripe.com/session" });
  });

  it("reuses an existing Stripe customer without creating a second one", async () => {
    findUniqueMock.mockResolvedValue({
      id: "user-1",
      email: "demo@devstash.io",
      stripeCustomerId: "cus_existing",
      isPro: false,
    });
    checkoutSessionsCreateMock.mockResolvedValue({ url: "https://checkout.stripe.com/session" });

    const result = await createCheckoutSession("yearly");

    expect(customersCreateMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
    expect(checkoutSessionsCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_existing" }),
    );
    expect(result).toEqual({ success: true, url: "https://checkout.stripe.com/session" });
  });

  it("fails soft when the Stripe SDK throws", async () => {
    findUniqueMock.mockResolvedValue({
      id: "user-1",
      email: "demo@devstash.io",
      stripeCustomerId: "cus_existing",
      isPro: false,
    });
    checkoutSessionsCreateMock.mockRejectedValue(new Error("stripe down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await createCheckoutSession("monthly");

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});

describe("createBillingPortalSession", () => {
  it("rejects an unauthenticated caller before touching Stripe", async () => {
    authMock.mockResolvedValue(null);

    const result = await createBillingPortalSession();

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to do that",
    });
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("rejects a user with no stripeCustomerId", async () => {
    findUniqueMock.mockResolvedValue({ stripeCustomerId: null });

    const result = await createBillingPortalSession();

    expect(result).toEqual({ success: false, error: "No billing account found" });
    expect(billingPortalSessionsCreateMock).not.toHaveBeenCalled();
  });

  it("returns the portal URL on success", async () => {
    findUniqueMock.mockResolvedValue({ stripeCustomerId: "cus_existing" });
    billingPortalSessionsCreateMock.mockResolvedValue({
      url: "https://billing.stripe.com/portal",
    });

    const result = await createBillingPortalSession();

    expect(billingPortalSessionsCreateMock).toHaveBeenCalledWith({
      customer: "cus_existing",
      return_url: "http://localhost:3000/settings",
    });
    expect(result).toEqual({ success: true, url: "https://billing.stripe.com/portal" });
  });
});
