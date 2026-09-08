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

/** Text-body item types created through the plain New Item form. */
export const CREATE_ITEM_TYPES = [
  "snippet",
  "prompt",
  "command",
  "note",
  "link",
] as const;

/** Item types whose body is an uploaded R2 object rather than text. */
export const FILE_ITEM_TYPES = ["file", "image"] as const;

/** Every type the New Item dialog can create. */
export const ALL_CREATE_ITEM_TYPES = [
  ...CREATE_ITEM_TYPES,
  ...FILE_ITEM_TYPES,
] as const;

export type CreateItemType = (typeof ALL_CREATE_ITEM_TYPES)[number];
export type FileItemType = (typeof FILE_ITEM_TYPES)[number];

/** Optional non-empty trimmed string, blank -> null. */
const optionalNonEmpty = z
  .string()
  .nullish()
  .transform((value) => {
    const trimmed = (value ?? "").trim();
    return trimmed.length > 0 ? trimmed : null;
  });

/**
 * Payload accepted by the `createItem` server action — the update fields plus a
 * `type` discriminator and (for `file` / `image`) the metadata of an
 * already-uploaded R2 object. `link` items must carry a URL and file/image items
 * must carry a `fileUrl` + `fileName` + `fileSize`; the client mirrors both
 * rules by disabling the submit button, but this schema is the source of truth.
 */
export const createItemSchema = updateItemSchema
  .extend({
    type: z.enum(ALL_CREATE_ITEM_TYPES),
    fileUrl: optionalNonEmpty,
    fileName: optionalNonEmpty,
    fileSize: z
      .number()
      .int()
      .positive()
      .nullish()
      .transform((value) => value ?? null),
  })
  .refine((data) => data.type !== "link" || data.url !== null, {
    message: "URL is required for links",
    path: ["url"],
  })
  .refine(
    (data) =>
      !(FILE_ITEM_TYPES as readonly string[]).includes(data.type) ||
      (data.fileUrl !== null &&
        data.fileName !== null &&
        data.fileSize !== null),
    {
      message: "Upload a file before saving",
      path: ["fileUrl"],
    },
  );

export type CreateItemInput = z.infer<typeof createItemSchema>;
