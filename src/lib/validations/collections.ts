import { z } from "zod";

import { optionalTrimmedText } from "@/lib/validations/shared";

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

/** Same shape as create — editing a collection only changes its name/description. */
export const updateCollectionSchema = createCollectionSchema;

export type UpdateCollectionInput = CreateCollectionInput;
