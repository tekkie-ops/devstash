import { isUserPro } from "@/lib/db/user";
import { isOpenAIConfigured } from "@/lib/openai";
import { aiFeatureMessage, isFeatureGatingEnabled } from "@/lib/plan-limits";
import { checkRateLimit, rateLimitExceededMessage } from "@/lib/rate-limit";

export type AiAccessResult = { ok: true } | { ok: false; error: string };

/**
 * Shared preamble for every AI action: OpenAI configured → Pro gate → rate
 * limit (20/hour/user, same across all AI actions). Call after auth()/Zod
 * validation; each action passes its own rate-limit key (e.g. "ai:tag").
 */
export async function requireAiAccess(
  userId: string,
  rateLimitKey: string,
): Promise<AiAccessResult> {
  if (!isOpenAIConfigured()) {
    return { ok: false, error: "AI features are not configured" };
  }

  if (isFeatureGatingEnabled() && !(await isUserPro(userId))) {
    return { ok: false, error: aiFeatureMessage() };
  }

  const rate = await checkRateLimit(rateLimitKey, userId, 20, "1 h");
  if (!rate.success) {
    return { ok: false, error: rateLimitExceededMessage(rate.reset) };
  }

  return { ok: true };
}
