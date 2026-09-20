import { NextResponse } from "next/server";

import { internalErrorResponse, notFoundResponse } from "@/lib/api-response";
import { requireUserId } from "@/lib/auth-guard";
import { toggleCollectionFavorite } from "@/lib/db/collections";

/**
 * Flips a collection's favorite state, from the /collections/[id] detail
 * page's Favorite button, the card dropdown's Favorite/Unfavorite item, or
 * the card's own toggle button. Auth-gated and scoped to collections the
 * caller owns, mirroring PATCH /api/collections/[id].
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserId();
  if (auth.response) return auth.response;

  const { id } = await params;

  try {
    const collection = await toggleCollectionFavorite(auth.userId, id);

    if (!collection) {
      return notFoundResponse("Collection");
    }

    return NextResponse.json({ success: true, data: collection });
  } catch (error) {
    return internalErrorResponse("toggleCollectionFavorite", error);
  }
}
