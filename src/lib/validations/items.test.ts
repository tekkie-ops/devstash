import { describe, expect, it } from "vitest";

import {
  createItemSchema,
  FILE_ITEM_TYPES,
  updateItemSchema,
} from "@/lib/validations/items";

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

describe("createItemSchema", () => {
  const valid = {
    type: "snippet" as const,
    title: "My snippet",
    description: "A short description",
    content: "console.log('hi')",
    url: null,
    language: "typescript",
    tags: ["react", "hooks"],
  };

  it("accepts a well-formed payload and defaults the file fields to null", () => {
    expect(createItemSchema.parse(valid)).toEqual({
      ...valid,
      fileUrl: null,
      fileName: null,
      fileSize: null,
    });
  });

  it("accepts a file item carrying uploaded object metadata", () => {
    const parsed = createItemSchema.parse({
      type: "file",
      title: "Runbook",
      content: null,
      url: null,
      language: null,
      tags: [],
      fileUrl: "https://cdn.example.com/items/file/abc.pdf",
      fileName: "runbook.pdf",
      fileSize: 2048,
    });
    expect(parsed).toMatchObject({
      type: "file",
      fileUrl: "https://cdn.example.com/items/file/abc.pdf",
      fileName: "runbook.pdf",
      fileSize: 2048,
    });
  });

  it("rejects a file/image item with no uploaded file", () => {
    for (const type of FILE_ITEM_TYPES) {
      const result = createItemSchema.safeParse({
        ...valid,
        type,
        content: null,
        fileUrl: null,
        fileName: null,
        fileSize: null,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe(
        "Upload a file before saving",
      );
    }
  });

  it("inherits the update rules (title required, tags deduped)", () => {
    expect(createItemSchema.safeParse({ ...valid, title: "  " }).success).toBe(
      false,
    );
    expect(
      createItemSchema.parse({ ...valid, tags: [" a ", "a"] }).tags,
    ).toEqual(["a"]);
  });

  it("rejects an unknown type", () => {
    expect(
      createItemSchema.safeParse({ ...valid, type: "banana" }).success,
    ).toBe(false);
  });

  it("requires a URL for link items", () => {
    const result = createItemSchema.safeParse({
      ...valid,
      type: "link",
      url: "",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("URL is required for links");
  });

  it("accepts a link item that carries a URL", () => {
    const parsed = createItemSchema.parse({
      ...valid,
      type: "link",
      content: null,
      url: "https://example.com",
    });
    expect(parsed.url).toBe("https://example.com");
  });
});
