import { describe, expect, it } from "vitest";

import { createCollectionSchema } from "@/lib/validations/collections";

describe("createCollectionSchema", () => {
  const valid = { name: "React Patterns", description: "Reusable patterns" };

  it("accepts a well-formed payload", () => {
    expect(createCollectionSchema.parse(valid)).toEqual(valid);
  });

  it("trims the name and rejects an empty one", () => {
    expect(
      createCollectionSchema.parse({ ...valid, name: "  Kept  " }).name,
    ).toBe("Kept");

    const result = createCollectionSchema.safeParse({ ...valid, name: "   " });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Name is required");
  });

  it("collapses blank description to null and trims otherwise", () => {
    expect(
      createCollectionSchema.parse({ ...valid, description: "   " })
        .description,
    ).toBeNull();
    expect(
      createCollectionSchema.parse({ ...valid, description: "  hi  " })
        .description,
    ).toBe("hi");
  });

  it("treats an omitted description as null", () => {
    expect(createCollectionSchema.parse({ name: "Only a name" })).toEqual({
      name: "Only a name",
      description: null,
    });
  });
});
