import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  explainCode,
  generateAutoTags,
  generateDescription,
  optimizePrompt,
} from "@/actions/ai";

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

const validDescriptionInput = {
  title: "useDebounce hook",
  content: "export function useDebounce(value, delay) { /* ... */ }",
  url: "",
  language: "typescript",
  fileName: "",
};

describe("generateDescription", () => {
  it("rejects an unauthenticated caller before touching OpenAI", async () => {
    authMock.mockResolvedValue(null);

    const result = await generateDescription(validDescriptionInput);

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to do that",
    });
    expect(responsesCreateMock).not.toHaveBeenCalled();
  });

  it("returns the Zod message when the title is blank", async () => {
    const result = await generateDescription({
      ...validDescriptionInput,
      title: "  ",
    });

    expect(result).toEqual({ success: false, error: "Title is required" });
    expect(responsesCreateMock).not.toHaveBeenCalled();
  });

  it("rejects when OpenAI isn't configured", async () => {
    isOpenAIConfiguredMock.mockReturnValue(false);

    const result = await generateDescription(validDescriptionInput);

    expect(result).toEqual({
      success: false,
      error: "AI features are not configured",
    });
    expect(responsesCreateMock).not.toHaveBeenCalled();
  });

  it("rejects a free user when feature gating is enabled", async () => {
    process.env.FEATURE_GATING_ENABLED = "true";
    findUniqueMock.mockResolvedValue({ isPro: false });

    const result = await generateDescription(validDescriptionInput);

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
      output_text: "A React hook that debounces a value by a delay.",
    });

    const result = await generateDescription(validDescriptionInput);

    expect(result).toEqual({
      success: true,
      data: { description: "A React hook that debounces a value by a delay." },
    });
  });

  it("trims whitespace from the model's response", async () => {
    responsesCreateMock.mockResolvedValue({
      output_text: "  A concise summary.  \n",
    });

    const result = await generateDescription(validDescriptionInput);

    expect(result).toEqual({
      success: true,
      data: { description: "A concise summary." },
    });
  });

  it("truncates an overly long response", async () => {
    responsesCreateMock.mockResolvedValue({
      output_text: "x".repeat(500),
    });

    const result = await generateDescription(validDescriptionInput);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description.length).toBe(300);
    }
  });

  it("truncates content before sending it to OpenAI", async () => {
    responsesCreateMock.mockResolvedValue({ output_text: "A summary." });

    await generateDescription({
      ...validDescriptionInput,
      content: "x".repeat(3000),
    });

    const call = responsesCreateMock.mock.calls[0][0];
    expect(call.input).toContain("(truncated)");
    expect(call.input.length).toBeLessThan(2500);
  });

  it("omits blank optional sections from the request", async () => {
    responsesCreateMock.mockResolvedValue({ output_text: "A summary." });

    await generateDescription({
      title: "Snippet only",
      content: "",
      url: "",
      language: "",
      fileName: "",
    });

    const call = responsesCreateMock.mock.calls[0][0];
    expect(call.input).not.toContain("<content>");
    expect(call.input).not.toContain("<url>");
    expect(call.input).not.toContain("<language>");
    expect(call.input).not.toContain("<file_name>");
  });

  it("includes a url-only item's url", async () => {
    responsesCreateMock.mockResolvedValue({ output_text: "A summary." });

    await generateDescription({
      title: "Playwright docs",
      content: "",
      url: "https://playwright.dev",
      language: "",
      fileName: "",
    });

    const call = responsesCreateMock.mock.calls[0][0];
    expect(call.input).toContain("<url>\nhttps://playwright.dev\n</url>");
  });

  it("fails soft when the model returns an empty response", async () => {
    responsesCreateMock.mockResolvedValue({ output_text: "   " });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await generateDescription(validDescriptionInput);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });

  it("fails soft when the OpenAI SDK throws", async () => {
    responsesCreateMock.mockRejectedValue(new Error("openai down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await generateDescription(validDescriptionInput);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});

const validExplainInput = {
  content: "export function useDebounce(value, delay) { /* ... */ }",
  language: "typescript",
};

describe("explainCode", () => {
  it("rejects an unauthenticated caller before touching OpenAI", async () => {
    authMock.mockResolvedValue(null);

    const result = await explainCode(validExplainInput);

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to do that",
    });
    expect(responsesCreateMock).not.toHaveBeenCalled();
  });

  it("returns the Zod message when content is blank", async () => {
    const result = await explainCode({ ...validExplainInput, content: "  " });

    expect(result).toEqual({ success: false, error: "Content is required" });
    expect(responsesCreateMock).not.toHaveBeenCalled();
  });

  it("rejects when OpenAI isn't configured", async () => {
    isOpenAIConfiguredMock.mockReturnValue(false);

    const result = await explainCode(validExplainInput);

    expect(result).toEqual({
      success: false,
      error: "AI features are not configured",
    });
    expect(responsesCreateMock).not.toHaveBeenCalled();
  });

  it("rejects a free user when feature gating is enabled", async () => {
    process.env.FEATURE_GATING_ENABLED = "true";
    findUniqueMock.mockResolvedValue({ isPro: false });

    const result = await explainCode(validExplainInput);

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
      output_text: "This debounces a value by delaying updates.",
    });

    const result = await explainCode(validExplainInput);

    expect(result).toEqual({
      success: true,
      data: { explanation: "This debounces a value by delaying updates." },
    });
  });

  it("trims whitespace from the model's response", async () => {
    responsesCreateMock.mockResolvedValue({
      output_text: "  A trimmed explanation.  \n",
    });

    const result = await explainCode(validExplainInput);

    expect(result).toEqual({
      success: true,
      data: { explanation: "A trimmed explanation." },
    });
  });

  it("truncates an overly long response", async () => {
    responsesCreateMock.mockResolvedValue({
      output_text: "x".repeat(3000),
    });

    const result = await explainCode(validExplainInput);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.explanation.length).toBe(2500);
    }
  });

  it("truncates content before sending it to OpenAI", async () => {
    responsesCreateMock.mockResolvedValue({ output_text: "An explanation." });

    await explainCode({ ...validExplainInput, content: "x".repeat(3000) });

    const call = responsesCreateMock.mock.calls[0][0];
    expect(call.input).toContain("(truncated)");
    expect(call.input.length).toBeLessThan(2500);
  });

  it("omits the language section when blank", async () => {
    responsesCreateMock.mockResolvedValue({ output_text: "An explanation." });

    await explainCode({ content: "echo hi", language: "" });

    const call = responsesCreateMock.mock.calls[0][0];
    expect(call.input).not.toContain("<language>");
  });

  it("fails soft when the model returns an empty response", async () => {
    responsesCreateMock.mockResolvedValue({ output_text: "   " });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await explainCode(validExplainInput);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });

  it("fails soft when the OpenAI SDK throws", async () => {
    responsesCreateMock.mockRejectedValue(new Error("openai down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await explainCode(validExplainInput);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});

const validOptimizeInput = {
  content: "Write me something about dogs.",
};

describe("optimizePrompt", () => {
  it("rejects an unauthenticated caller before touching OpenAI", async () => {
    authMock.mockResolvedValue(null);

    const result = await optimizePrompt(validOptimizeInput);

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to do that",
    });
    expect(responsesCreateMock).not.toHaveBeenCalled();
  });

  it("returns the Zod message when content is blank", async () => {
    const result = await optimizePrompt({ content: "  " });

    expect(result).toEqual({ success: false, error: "Content is required" });
    expect(responsesCreateMock).not.toHaveBeenCalled();
  });

  it("rejects when OpenAI isn't configured", async () => {
    isOpenAIConfiguredMock.mockReturnValue(false);

    const result = await optimizePrompt(validOptimizeInput);

    expect(result).toEqual({
      success: false,
      error: "AI features are not configured",
    });
    expect(responsesCreateMock).not.toHaveBeenCalled();
  });

  it("rejects a free user when feature gating is enabled", async () => {
    process.env.FEATURE_GATING_ENABLED = "true";
    findUniqueMock.mockResolvedValue({ isPro: false });

    const result = await optimizePrompt(validOptimizeInput);

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
      output_text: "Write a 200-word, warm and informative piece about dogs.",
    });

    const result = await optimizePrompt(validOptimizeInput);

    expect(result).toEqual({
      success: true,
      data: {
        optimized: "Write a 200-word, warm and informative piece about dogs.",
      },
    });
  });

  it("trims whitespace from the model's response", async () => {
    responsesCreateMock.mockResolvedValue({
      output_text: "  A refined prompt.  \n",
    });

    const result = await optimizePrompt(validOptimizeInput);

    expect(result).toEqual({
      success: true,
      data: { optimized: "A refined prompt." },
    });
  });

  it("truncates an overly long response", async () => {
    responsesCreateMock.mockResolvedValue({
      output_text: "x".repeat(5000),
    });

    const result = await optimizePrompt(validOptimizeInput);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.optimized.length).toBe(4000);
    }
  });

  it("truncates content before sending it to OpenAI", async () => {
    responsesCreateMock.mockResolvedValue({ output_text: "A refined prompt." });

    await optimizePrompt({ content: "x".repeat(3000) });

    const call = responsesCreateMock.mock.calls[0][0];
    expect(call.input).toContain("(truncated)");
    expect(call.input.length).toBeLessThan(2500);
  });

  it("fails soft when the model returns an empty response", async () => {
    responsesCreateMock.mockResolvedValue({ output_text: "   " });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await optimizePrompt(validOptimizeInput);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });

  it("fails soft when the OpenAI SDK throws", async () => {
    responsesCreateMock.mockRejectedValue(new Error("openai down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await optimizePrompt(validOptimizeInput);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});
