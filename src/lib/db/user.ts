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
