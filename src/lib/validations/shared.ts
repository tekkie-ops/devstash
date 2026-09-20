import { z } from "zod";

/** Optional free text: trims, and collapses "" / whitespace-only to null. */
export const optionalTrimmedText = z
  .string()
  .nullish()
  .transform((value) => {
    const trimmed = (value ?? "").trim();
    return trimmed.length > 0 ? trimmed : null;
  });
