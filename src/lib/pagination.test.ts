import { describe, expect, it } from "vitest";

import { getSkip, getTotalPages, parsePage } from "@/lib/pagination";

describe("parsePage", () => {
  it("defaults to 1 when undefined", () => {
    expect(parsePage(undefined)).toBe(1);
  });

  it("parses a valid numeric string", () => {
    expect(parsePage("3")).toBe(3);
  });

  it("takes the first value when given an array", () => {
    expect(parsePage(["2", "5"])).toBe(2);
  });

  it("defaults to 1 for zero, negative, non-integer, or non-numeric input", () => {
    expect(parsePage("0")).toBe(1);
    expect(parsePage("-1")).toBe(1);
    expect(parsePage("2.5")).toBe(1);
    expect(parsePage("abc")).toBe(1);
  });
});

describe("getTotalPages", () => {
  it("divides and rounds up", () => {
    expect(getTotalPages(43, 21)).toBe(3);
    expect(getTotalPages(42, 21)).toBe(2);
  });

  it("returns 1 for zero items so there's always at least one page", () => {
    expect(getTotalPages(0, 21)).toBe(1);
  });
});

describe("getSkip", () => {
  it("returns 0 for the first page", () => {
    expect(getSkip(1, 21)).toBe(0);
  });

  it("offsets by whole pages", () => {
    expect(getSkip(3, 21)).toBe(42);
  });
});
