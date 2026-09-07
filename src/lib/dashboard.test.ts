import { describe, expect, it } from "vitest";

import { formatItemDate } from "@/lib/dashboard";

describe("formatItemDate", () => {
  it("formats a date as a short month and day", () => {
    expect(formatItemDate(new Date("2026-01-15T12:00:00Z"))).toBe("Jan 15");
    expect(formatItemDate(new Date("2026-08-21T00:00:00Z"))).toBe("Aug 21");
  });

  it("is pinned to UTC, so a late-day timestamp does not roll to the next day", () => {
    expect(formatItemDate(new Date("2026-03-01T23:59:59Z"))).toBe("Mar 1");
  });
});
