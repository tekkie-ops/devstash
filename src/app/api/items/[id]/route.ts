import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth-guard";
import { getItemDetail } from "@/lib/db/items";

/**
 * Full item detail for the drawer. Auth-gated (the page routes are covered by
 * proxy.ts, but /api/* is not), then scoped to items the caller owns.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserId();
  if (auth.response) return auth.response;

  const { id } = await params;
  const item = await getItemDetail(auth.userId, id);

  if (!item) {
    return NextResponse.json(
      { success: false, error: "Item not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true, data: item });
}
