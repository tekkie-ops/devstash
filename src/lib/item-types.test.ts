import { describe, expect, it } from "vitest";

import { SYSTEM_TYPE_ORDER, toLabel } from "@/lib/item-types";

describe("toLabel", () => {
  it("capitalizes and pluralizes a type name", () => {
    expect(toLabel("snippet")).toBe("Snippets");
    expect(toLabel("image")).toBe("Images");
  });

  it("round-trips every system type to a distinct label", () => {
    const labels = SYSTEM_TYPE_ORDER.map(toLabel);
    expect(labels).toEqual([
      "Snippets",
      "Prompts",
      "Commands",
      "Notes",
      "Files",
      "Images",
      "Links",
    ]);
    expect(new Set(labels).size).toBe(SYSTEM_TYPE_ORDER.length);
  });
});
