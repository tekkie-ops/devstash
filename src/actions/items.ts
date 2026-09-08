"use server";

import { auth } from "@/auth";
import {
  createItem as createItemRecord,
  deleteItem as deleteItemRecord,
  updateItem as updateItemRecord,
} from "@/lib/db/items";
import type { ItemDetail } from "@/lib/db/items";
import { createItemSchema, updateItemSchema } from "@/lib/validations/items";

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
 * Creates an item from the New Item dialog. Zod is the source of truth for
 * validation, including the "URL required for links" rule; the client only
 * mirrors it to disable the submit button.
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

  try {
    const created = await createItemRecord(parsed.data);
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
 * Persists an edit from the item drawer. Zod is the source of truth for
 * validation; the client only guards the Save button on an empty title.
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
    const updated = await updateItemRecord(itemId, parsed.data);
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
 * Permanently deletes an item from the drawer's confirm dialog. Signed-in check
 * only, like `updateItem` — the dashboard is still demo-user-scoped.
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
    const deleted = await deleteItemRecord(itemId);
    if (!deleted) {
      return { success: false, error: "Item not found" };
    }
    return { success: true };
  } catch (error) {
    console.error("deleteItem failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
