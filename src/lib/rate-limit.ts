import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const limiters = new Map<string, Ratelimit>();

function getLimiter(prefix: string, limit: number, window: Duration) {
  if (!redis) return null;

  let limiter = limiters.get(prefix);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix: `ratelimit:${prefix}`,
    });
    limiters.set(prefix, limiter);
  }
  return limiter;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

export async function checkRateLimit(
  prefix: string,
  identifier: string,
  limit: number,
  window: Duration
): Promise<RateLimitResult> {
  const limiter = getLimiter(prefix, limit, window);
  if (!limiter) {
    return { success: true, remaining: limit, reset: Date.now() };
  }

  try {
    const result = await limiter.limit(identifier);
    return { success: result.success, remaining: result.remaining, reset: result.reset };
  } catch (error) {
    console.error(`Rate limit check failed for "${prefix}"`, error);
    return { success: true, remaining: limit, reset: Date.now() };
  }
}

export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return "unknown";
}

function formatRetryAfter(reset: number) {
  const seconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  const minutes = Math.ceil(seconds / 60);
  return { seconds, minutes };
}

export function rateLimitExceededMessage(reset: number) {
  const { minutes } = formatRetryAfter(reset);
  return `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}

export function rateLimitResponse(reset: number) {
  const { seconds } = formatRetryAfter(reset);
  return NextResponse.json(
    { success: false, error: rateLimitExceededMessage(reset) },
    { status: 429, headers: { "Retry-After": String(seconds) } }
  );
}
