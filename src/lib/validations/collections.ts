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
 * Payload accepted by `POST /api/collections`. The route is the source of
 * truth for validation; the client only guards the submit button on an empty
 * name.
 */
export const createCollectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: optionalTrimmedText,
});

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
