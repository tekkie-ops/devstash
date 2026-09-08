import { describe, expect, it } from "vitest";

import { updateItemSchema } from "@/lib/validations/items";

describe("updateItemSchema", () => {
  const valid = {
    title: "My snippet",
    description: "A short description",
    content: "console.log('hi')",
    url: null,
    language: "typescript",
    tags: ["react", "hooks"],
  };

  it("accepts a well-formed payload", () => {
    expect(updateItemSchema.parse(valid)).toEqual(valid);
  });

  it("trims the title and rejects an empty one", () => {
    expect(updateItemSchema.parse({ ...valid, title: "  Kept  " }).title).toBe(
      "Kept",
    );

    const result = updateItemSchema.safeParse({ ...valid, title: "   " });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Title is required");
  });

  it("collapses blank optional text to null and trims the rest", () => {
    const parsed = updateItemSchema.parse({
      ...valid,
      description: "   ",
      language: "  go  ",
    });
    expect(parsed.description).toBeNull();
    expect(parsed.language).toBe("go");
  });

  it("treats omitted optional fields as null", () => {
    const parsed = updateItemSchema.parse({ title: "Only a title" });
    expect(parsed).toMatchObject({
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
    });
  });

  it("preserves content verbatim but nulls an empty string", () => {
    expect(
      updateItemSchema.parse({ ...valid, content: "  indented\n" }).content,
    ).toBe("  indented\n");
    expect(updateItemSchema.parse({ ...valid, content: "" }).content).toBeNull();
  });

  it("accepts a valid URL, trims it, and nulls an empty one", () => {
    expect(
      updateItemSchema.parse({ ...valid, url: "  https://example.com  " }).url,
    ).toBe("https://example.com");
    expect(updateItemSchema.parse({ ...valid, url: "" }).url).toBeNull();
  });

  it("rejects an invalid URL", () => {
    const result = updateItemSchema.safeParse({ ...valid, url: "not a url" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Enter a valid URL (including https://)",
    );
  });

  it("trims tags, drops duplicates, and rejects a blank tag", () => {
    expect(
      updateItemSchema.parse({ ...valid, tags: [" react ", "react", "hooks"] })
        .tags,
    ).toEqual(["react", "hooks"]);

    expect(
      updateItemSchema.safeParse({ ...valid, tags: ["ok", "  "] }).success,
    ).toBe(false);
  });
});
