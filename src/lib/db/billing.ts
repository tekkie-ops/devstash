import { prisma } from "@/lib/prisma";

export interface BillingAccount {
  isPro: boolean;
  hasStripeCustomer: boolean;
}

export async function getBillingAccount(userId: string): Promise<BillingAccount | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPro: true, stripeCustomerId: true },
  });

  if (!user) return null;

  return { isPro: user.isPro, hasStripeCustomer: user.stripeCustomerId !== null };
}
