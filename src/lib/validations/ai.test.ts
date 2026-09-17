import { describe, expect, it } from "vitest";

import {
  generateAutoTagsSchema,
  generateDescriptionSchema,
  tagSuggestionsSchema,
} from "@/lib/validations/ai";

describe("generateAutoTagsSchema", () => {
  it("requires a non-blank title", () => {
    const result = generateAutoTagsSchema.safeParse({ title: "  " });
    expect(result.success).toBe(false);
  });

  it("defaults missing description/content to empty strings", () => {
    const result = generateAutoTagsSchema.safeParse({ title: "Snippet" });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      title: "Snippet",
      description: "",
      content: "",
    });
  });
});

describe("tagSuggestionsSchema", () => {
  it("accepts a non-empty array of strings", () => {
    const result = tagSuggestionsSchema.safeParse(["react", "hooks"]);
    expect(result.success).toBe(true);
  });

  it("rejects more than 8 tags", () => {
    const result = tagSuggestionsSchema.safeParse(
      Array.from({ length: 9 }, (_, i) => `tag${i}`),
    );
    expect(result.success).toBe(false);
  });

  it("rejects a non-array value", () => {
    const result = tagSuggestionsSchema.safeParse({ tags: ["react"] });
    expect(result.success).toBe(false);
  });

  it("rejects an empty array", () => {
    const result = tagSuggestionsSchema.safeParse([]);
    expect(result.success).toBe(false);
  });
});

describe("generateDescriptionSchema", () => {
  it("requires a non-blank title", () => {
    const result = generateDescriptionSchema.safeParse({ title: "  " });
    expect(result.success).toBe(false);
  });

  it("defaults missing content/url/language/fileName to empty strings", () => {
    const result = generateDescriptionSchema.safeParse({ title: "Snippet" });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      title: "Snippet",
      content: "",
      url: "",
      language: "",
      fileName: "",
    });
  });

  it("accepts a fully populated payload", () => {
    const result = generateDescriptionSchema.safeParse({
      title: "useDebounce hook",
      content: "export function useDebounce() {}",
      url: "",
      language: "typescript",
      fileName: "",
    });
    expect(result.success).toBe(true);
  });
});
