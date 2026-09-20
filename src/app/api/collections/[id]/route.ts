import { NextResponse } from "next/server";

import {
  internalErrorResponse,
  notFoundResponse,
  parseJsonBody,
} from "@/lib/api-response";
import { requireUserId } from "@/lib/auth-guard";
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
  const auth = await requireUserId();
  if (auth.response) return auth.response;

  const parsed = await parseJsonBody(request, updateCollectionSchema);
  if (parsed.response) return parsed.response;

  const { id } = await params;

  try {
    const collection = await updateCollection(auth.userId, id, parsed.data);

    if (!collection) {
      return notFoundResponse("Collection");
    }

    return NextResponse.json({ success: true, data: collection });
  } catch (error) {
    return internalErrorResponse("updateCollection", error);
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
  const auth = await requireUserId();
  if (auth.response) return auth.response;

  const { id } = await params;

  try {
    const deleted = await deleteCollection(auth.userId, id);

    if (!deleted) {
      return notFoundResponse("Collection");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return internalErrorResponse("deleteCollection", error);
  }
}
