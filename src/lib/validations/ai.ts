import { z } from "zod";

/**
 * Input accepted by `generateAutoTags`. Takes the raw form fields rather than
 * an item id, since the create-item dialog needs suggestions before the item
 * exists — the drawer's edit form passes the same fields from its own state.
 */
export const generateAutoTagsSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  content: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
});

export type GenerateAutoTagsInput = z.infer<typeof generateAutoTagsSchema>;

/**
 * Shape of a successful tag-suggestion result, after normalizing the model's
 * raw JSON (which may come back as `{ tags: [...] }` or a bare `[...]`).
 */
export const tagSuggestionsSchema = z
  .array(z.string().trim().min(1))
  .min(1)
  .max(8);

/**
 * Input accepted by `generateDescription`. Every field beyond title is
 * optional since it covers every item type — a link only has a url, a
 * snippet only has content/language, a file/image only has a fileName (its
 * drawer edit form exposes no other fields to send).
 */
export const generateDescriptionSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  content: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  url: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  language: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
  fileName: z
    .string()
    .nullish()
    .transform((value) => value ?? ""),
});

export type GenerateDescriptionInput = z.infer<
  typeof generateDescriptionSchema
>;
