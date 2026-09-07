import { describe, expect, it } from "vitest";

import {
  checkRateLimit,
  getClientIp,
  rateLimitExceededMessage,
} from "@/lib/rate-limit";

describe("getClientIp", () => {
  it("returns the first entry of x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" });
    expect(getClientIp(headers)).toBe("203.0.113.7");
  });

  it("trims whitespace around the forwarded ip", () => {
    const headers = new Headers({ "x-forwarded-for": "  198.51.100.2  " });
    expect(getClientIp(headers)).toBe("198.51.100.2");
  });

  it("falls back to 'unknown' when the header is absent", () => {
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});

describe("rateLimitExceededMessage", () => {
  it("uses the singular 'minute' when a minute or less remains", () => {
    expect(rateLimitExceededMessage(Date.now() + 60_000)).toBe(
      "Too many attempts. Please try again in 1 minute.",
    );
  });

  it("uses the plural 'minutes' for longer waits", () => {
    expect(rateLimitExceededMessage(Date.now() + 10 * 60_000)).toBe(
      "Too many attempts. Please try again in 10 minutes.",
    );
  });
});

describe("checkRateLimit", () => {
  it("fails open when no Upstash credentials are configured", async () => {
    const result = await checkRateLimit("test", "1.2.3.4", 5, "15 m");
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(5);
  });
});
