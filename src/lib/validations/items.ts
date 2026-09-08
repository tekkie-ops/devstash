import { z } from "zod";

/** Optional free text: trims, and collapses "" / whitespace-only to null. */
const optionalTrimmedText = z
  .string()
  .nullish()
  .transform((value) => {
    const trimmed = (value ?? "").trim();
    return trimmed.length > 0 ? trimmed : null;
  });

/**
 * Optional body text that must survive round-tripping verbatim (code, prompts),
 * so it is not trimmed — only an empty string collapses to null.
 */
const optionalRawText = z
  .string()
  .nullish()
  .transform((value) => (value && value.length > 0 ? value : null));

/** Optional URL: trims, allows empty (-> null), otherwise must be a valid URL. */
const optionalUrl = z
  .string()
  .nullish()
  .transform((value) => (value ?? "").trim())
  .refine((value) => value === "" || z.string().url().safeParse(value).success, {
    message: "Enter a valid URL (including https://)",
  })
  .transform((value) => (value === "" ? null : value));

/**
 * Payload accepted by the `updateItem` server action. The server action is the
 * source of truth for validation (per coding-standards.md); the client only does
 * a basic "title not empty" guard on the Save button.
 */
export const updateItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: optionalTrimmedText,
  content: optionalRawText,
  url: optionalUrl,
  language: optionalTrimmedText,
  tags: z
    .array(z.string().trim().min(1, "Tags cannot be empty"))
    .transform((tags) => Array.from(new Set(tags)))
    .default([]),
});

export type UpdateItemInput = z.infer<typeof updateItemSchema>;
