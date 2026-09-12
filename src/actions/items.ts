"use server";

import { auth } from "@/auth";
import {
  createItem as createItemRecord,
  deleteItem as deleteItemRecord,
  toggleItemFavorite as toggleItemFavoriteRecord,
  updateItem as updateItemRecord,
} from "@/lib/db/items";
import type { ItemDetail } from "@/lib/db/items";
import { r2KeyFromUrl } from "@/lib/r2";
import {
  FILE_ITEM_TYPES,
  createItemSchema,
  updateItemSchema,
} from "@/lib/validations/items";

export type CreateItemResult =
  | { success: true; data: ItemDetail }
  | { success: false; error: string };

export type UpdateItemResult =
  | { success: true; data: ItemDetail }
  | { success: false; error: string };

export type DeleteItemResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Creates an item owned by the signed-in user from the New Item dialog. Zod is
 * the source of truth for validation, including the "URL required for links"
 * rule; the client only mirrors it to disable the submit button. A `file` /
 * `image` item's `fileUrl` must point at an object under our configured
 * `R2_PUBLIC_URL` — anything else means the upload flow was bypassed.
 */
export async function createItem(input: unknown): Promise<CreateItemResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to do that" };
  }

  const parsed = createItemSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  if (
    (FILE_ITEM_TYPES as readonly string[]).includes(parsed.data.type) &&
    (parsed.data.fileUrl === null || r2KeyFromUrl(parsed.data.fileUrl) === null)
  ) {
    return { success: false, error: "Invalid file URL" };
  }

  try {
    const created = await createItemRecord(session.user.id, parsed.data);
    if (!created) {
      return { success: false, error: "Couldn't create item" };
    }
    return { success: true, data: created };
  } catch (error) {
    console.error("createItem failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Persists an edit from the item drawer, scoped to items the signed-in user
 * owns. Zod is the source of truth for validation; the client only guards the
 * Save button on an empty title.
 */
export async function updateItem(
  itemId: string,
  input: unknown,
): Promise<UpdateItemResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to do that" };
  }

  if (typeof itemId !== "string" || itemId.trim() === "") {
    return { success: false, error: "Invalid item" };
  }

  const parsed = updateItemSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  try {
    const updated = await updateItemRecord(session.user.id, itemId, parsed.data);
    if (!updated) {
      return { success: false, error: "Item not found" };
    }
    return { success: true, data: updated };
  } catch (error) {
    console.error("updateItem failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Flips an item's favorite state from the drawer's action bar or an item
 * card's overlay button, scoped to items the signed-in user owns.
 */
export async function toggleItemFavorite(
  itemId: string,
): Promise<UpdateItemResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to do that" };
  }

  if (typeof itemId !== "string" || itemId.trim() === "") {
    return { success: false, error: "Invalid item" };
  }

  try {
    const updated = await toggleItemFavoriteRecord(session.user.id, itemId);
    if (!updated) {
      return { success: false, error: "Item not found" };
    }
    return { success: true, data: updated };
  } catch (error) {
    console.error("toggleItemFavorite failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Permanently deletes an item from the drawer's confirm dialog, scoped to items
 * the signed-in user owns.
 */
export async function deleteItem(itemId: string): Promise<DeleteItemResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to do that" };
  }

  if (typeof itemId !== "string" || itemId.trim() === "") {
    return { success: false, error: "Invalid item" };
  }

  try {
    const deleted = await deleteItemRecord(session.user.id, itemId);
    if (!deleted) {
      return { success: false, error: "Item not found" };
    }
    return { success: true };
  } catch (error) {
    console.error("deleteItem failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
