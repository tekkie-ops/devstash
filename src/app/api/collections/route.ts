import { NextResponse } from "next/server";

import { internalErrorResponse, parseJsonBody } from "@/lib/api-response";
import { requireUserId } from "@/lib/auth-guard";
import { createCollection, getCollectionStats } from "@/lib/db/collections";
import {
  FREE_COLLECTION_LIMIT,
  collectionLimitMessage,
  isFeatureGatingEnabled,
} from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";
import { createCollectionSchema } from "@/lib/validations/collections";

/**
 * Creates a collection owned by the signed-in user, from the New Collection
 * dialog. Auth-gated (the page routes are covered by proxy.ts, but /api/* is
 * not); the schema is the source of truth for validation.
 */
export async function POST(request: Request) {
  const auth = await requireUserId();
  if (auth.response) return auth.response;

  const parsed = await parseJsonBody(request, createCollectionSchema);
  if (parsed.response) return parsed.response;

  if (isFeatureGatingEnabled()) {
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { isPro: true },
    });

    if (!user?.isPro) {
      const stats = await getCollectionStats(auth.userId);
      if (stats.total >= FREE_COLLECTION_LIMIT) {
        return NextResponse.json(
          { success: false, error: collectionLimitMessage() },
          { status: 403 },
        );
      }
    }
  }

  try {
    const collection = await createCollection(auth.userId, parsed.data);
    return NextResponse.json({ success: true, data: collection });
  } catch (error) {
    return internalErrorResponse("createCollection", error);
  }
}
