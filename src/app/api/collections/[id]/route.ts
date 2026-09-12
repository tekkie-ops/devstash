import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { deleteCollection, updateCollection } from "@/lib/db/collections";
import { updateCollectionSchema } from "@/lib/validations/collections";

/**
 * Edits a collection's name/description, from the Edit dialog (card dropdown
 * or the /collections/[id] detail page). Auth-gated and scoped to collections
 * the caller owns, mirroring POST /api/collections.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = updateCollectionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      },
      { status: 400 },
    );
  }

  const { id } = await params;

  try {
    const collection = await updateCollection(
      session.user.id,
      id,
      parsed.data,
    );

    if (!collection) {
      return NextResponse.json(
        { success: false, error: "Collection not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: collection });
  } catch (error) {
    console.error("updateCollection failed:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}

/**
 * Deletes a collection. Its items are not deleted — only their membership in
 * this collection goes away (the schema cascades ItemCollection rows, not
 * Item rows), so they remain in any other collection they belong to.
 */
export async function DELETE(
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
    const deleted = await deleteCollection(session.user.id, id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Collection not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("deleteCollection failed:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
