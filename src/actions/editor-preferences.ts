"use server";

import { auth } from "@/auth";
import { updateEditorPreferences as updateEditorPreferencesRecord } from "@/lib/db/editor-preferences";
import {
  editorPreferencesSchema,
  type EditorPreferences,
} from "@/lib/validations/editor-preferences";

export type UpdateEditorPreferencesResult =
  | { success: true; data: EditorPreferences }
  | { success: false; error: string };

/**
 * Persists the editor preferences form's auto-save on every field change.
 * Zod is the source of truth for validation — the form only ever sends known
 * dropdown/toggle values, but this guards against a tampered client call.
 */
export async function updateEditorPreferences(
  input: unknown,
): Promise<UpdateEditorPreferencesResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to do that" };
  }

  const parsed = editorPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  try {
    const updated = await updateEditorPreferencesRecord(session.user.id, parsed.data);
    return { success: true, data: updated };
  } catch (error) {
    console.error("updateEditorPreferences failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
