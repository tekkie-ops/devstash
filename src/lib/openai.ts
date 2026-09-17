import OpenAI from "openai";

/**
 * Lazy OpenAI client singleton, mirroring src/lib/stripe.ts's and src/lib/r2.ts's
 * pattern. Empty when unconfigured — callers should return a friendly "AI
 * features are not configured" error rather than let the SDK throw on a
 * missing key.
 */
let client: OpenAI | null = null;

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function openaiClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY ?? "",
      maxRetries: 2,
      timeout: 20_000, // well under a Server Action's normal round-trip budget
    });
  }
  return client;
}

/** The one model every AI feature uses — see project-overview.md §6. */
export const AI_MODEL = "gpt-5-nano";
