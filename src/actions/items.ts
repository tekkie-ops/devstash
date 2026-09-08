"use server";

import { auth } from "@/auth";
import { updateItem as updateItemRecord } from "@/lib/db/items";
import type { ItemDetail } from "@/lib/db/items";
import { updateItemSchema } from "@/lib/validations/items";

export type UpdateItemResult =
  | { success: true; data: ItemDetail }
  | { success: false; error: string };

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
