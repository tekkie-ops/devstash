import { NextResponse } from "next/server";

import { auth } from "@/auth";
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
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { id } = await params;

  try {
    const collection = await toggleCollectionFavorite(session.user.id, id);

    if (!collection) {
      return NextResponse.json(
        { success: false, error: "Collection not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: collection });
  } catch (error) {
    console.error("toggleCollectionFavorite failed:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
