import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getItemDetail } from "@/lib/db/items";

/**
 * Full item detail for the drawer. Auth-gated (the page routes are covered by
 * proxy.ts, but /api/* is not), then delegates to the demo-user-scoped query.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { id } = await params;
  const item = await getItemDetail(id);

  if (!item) {
    return NextResponse.json(
      { success: false, error: "Item not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true, data: item });
}
