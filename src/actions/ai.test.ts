import { beforeEach, describe, expect, it, vi } from "vitest";

import { generateAutoTags } from "@/actions/ai";

const { authMock, findUniqueMock, isOpenAIConfiguredMock, responsesCreateMock } =
  vi.hoisted(() => ({
    authMock: vi.fn(),
    findUniqueMock: vi.fn(),
    isOpenAIConfiguredMock: vi.fn(),
    responsesCreateMock: vi.fn(),
  }));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: findUniqueMock,
    },
  },
}));

vi.mock("@/lib/openai", () => ({
  AI_MODEL: "gpt-5-nano",
  isOpenAIConfigured: isOpenAIConfiguredMock,
  openaiClient: () => ({
    responses: { create: responsesCreateMock },
  }),
}));

const validInput = {
  title: "useDebounce hook",
  description: "A React hook that debounces a value",
  content: "export function useDebounce(value, delay) { /* ... */ }",
};

const originalFeatureGating = process.env.FEATURE_GATING_ENABLED;

beforeEach(() => {
  authMock.mockReset();
  findUniqueMock.mockReset();
  isOpenAIConfiguredMock.mockReset();
  responsesCreateMock.mockReset();

  authMock.mockResolvedValue({ user: { id: "user-1" } });
  isOpenAIConfiguredMock.mockReturnValue(true);

  if (originalFeatureGating === undefined) {
    delete process.env.FEATURE_GATING_ENABLED;
  } else {
    process.env.FEATURE_GATING_ENABLED = originalFeatureGating;
  }
});

describe("generateAutoTags", () => {
  it("rejects an unauthenticated caller before touching OpenAI", async () => {
    authMock.mockResolvedValue(null);

    const result = await generateAutoTags(validInput);

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to do that",
    });
    expect(responsesCreateMock).not.toHaveBeenCalled();
  });

  it("returns the Zod message when the title is blank", async () => {
    const result = await generateAutoTags({ ...validInput, title: "  " });

    expect(result).toEqual({ success: false, error: "Title is required" });
    expect(responsesCreateMock).not.toHaveBeenCalled();
  });

  it("rejects when OpenAI isn't configured", async () => {
    isOpenAIConfiguredMock.mockReturnValue(false);

    const result = await generateAutoTags(validInput);

    expect(result).toEqual({
      success: false,
      error: "AI features are not configured",
    });
    expect(responsesCreateMock).not.toHaveBeenCalled();
  });

  it("rejects a free user when feature gating is enabled", async () => {
    process.env.FEATURE_GATING_ENABLED = "true";
    findUniqueMock.mockResolvedValue({ isPro: false });

    const result = await generateAutoTags(validInput);

    expect(result).toEqual({
      success: false,
      error: "AI features are a Pro feature. Upgrade to Pro to use them.",
    });
    expect(responsesCreateMock).not.toHaveBeenCalled();
  });

  it("allows a Pro user through when feature gating is enabled", async () => {
    process.env.FEATURE_GATING_ENABLED = "true";
    findUniqueMock.mockResolvedValue({ isPro: true });
    responsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify({ tags: ["react", "hooks"] }),
    });

    const result = await generateAutoTags(validInput);

    expect(result).toEqual({ success: true, data: { tags: ["react", "hooks"] } });
  });

  it("parses a bare array response", async () => {
    responsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify(["Snippet", "React"]),
    });

    const result = await generateAutoTags(validInput);

    expect(result).toEqual({ success: true, data: { tags: ["snippet", "react"] } });
  });

  it("normalizes tags to lowercase and dedupes them", async () => {
    responsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify({ tags: ["React", "react", "Hooks"] }),
    });

    const result = await generateAutoTags(validInput);

    expect(result).toEqual({ success: true, data: { tags: ["react", "hooks"] } });
  });

  it("truncates content before sending it to OpenAI", async () => {
    responsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify({ tags: ["long"] }),
    });

    await generateAutoTags({ ...validInput, content: "x".repeat(3000) });

    const call = responsesCreateMock.mock.calls[0][0];
    expect(call.input).toContain("(truncated)");
    expect(call.input.length).toBeLessThan(2500);
  });

  it("fails soft when the model returns invalid JSON", async () => {
    responsesCreateMock.mockResolvedValue({ output_text: "not json" });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await generateAutoTags(validInput);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });

  it("fails soft when the model returns an unexpected shape", async () => {
    responsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify({ notTags: ["a"] }),
    });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await generateAutoTags(validInput);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });

  it("fails soft when the OpenAI SDK throws", async () => {
    responsesCreateMock.mockRejectedValue(new Error("openai down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await generateAutoTags(validInput);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});
