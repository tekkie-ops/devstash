import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * No auth is wired up yet (see project-overview.md open questions), so every
 * dashboard query is scoped to the single seeded demo user for now.
 */
const DEMO_USER_EMAIL = "demo@devstash.io";

/** Deduped per request via React's cache() — a dashboard load calls this from several places. */
export const getDemoUserId = cache(async (): Promise<string | null> => {
  const user = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
    select: { id: true },
  });

  return user?.id ?? null;
});

/**
 * Re-reads Pro status straight from the DB — never trust a session/JWT claim
 * for a gating decision, since it can lag a webhook-driven change.
 */
export async function isUserPro(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPro: true },
  });

  return user?.isPro ?? false;
}
