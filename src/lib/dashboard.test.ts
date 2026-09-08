import { describe, expect, it } from "vitest";

import { formatItemDate, formatLongDate } from "@/lib/dashboard";

describe("formatItemDate", () => {
  it("formats a date as a short month and day", () => {
    expect(formatItemDate(new Date("2026-01-15T12:00:00Z"))).toBe("Jan 15");
    expect(formatItemDate(new Date("2026-08-21T00:00:00Z"))).toBe("Aug 21");
  });

  it("is pinned to UTC, so a late-day timestamp does not roll to the next day", () => {
    expect(formatItemDate(new Date("2026-03-01T23:59:59Z"))).toBe("Mar 1");
  });
});

describe("formatLongDate", () => {
  it("formats a date as a long month, day and year", () => {
    expect(formatLongDate(new Date("2024-01-15T12:00:00Z"))).toBe(
      "January 15, 2024",
    );
  });

  it("is pinned to UTC, so a late-day timestamp does not roll to the next day", () => {
    expect(formatLongDate(new Date("2026-03-01T23:59:59Z"))).toBe("March 1, 2026");
  });
});
