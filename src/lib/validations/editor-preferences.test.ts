import { describe, expect, it } from "vitest";

import {
  DEFAULT_EDITOR_PREFERENCES,
  editorPreferencesSchema,
  parseEditorPreferences,
} from "./editor-preferences";

describe("editorPreferencesSchema", () => {
  it("accepts a valid preferences object", () => {
    const result = editorPreferencesSchema.safeParse({
      fontSize: 16,
      tabSize: 4,
      wordWrap: false,
      minimap: true,
      theme: "monokai",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown font size", () => {
    const result = editorPreferencesSchema.safeParse({
      ...DEFAULT_EDITOR_PREFERENCES,
      fontSize: 99,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown tab size", () => {
    const result = editorPreferencesSchema.safeParse({
      ...DEFAULT_EDITOR_PREFERENCES,
      tabSize: 3,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown theme", () => {
    const result = editorPreferencesSchema.safeParse({
      ...DEFAULT_EDITOR_PREFERENCES,
      theme: "solarized",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing field", () => {
    const rest: Record<string, unknown> = { ...DEFAULT_EDITOR_PREFERENCES };
    delete rest.wordWrap;
    const result = editorPreferencesSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe("parseEditorPreferences", () => {
  it("returns defaults for null", () => {
    expect(parseEditorPreferences(null)).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("returns defaults for malformed JSON", () => {
    expect(parseEditorPreferences({ fontSize: "large" })).toEqual(
      DEFAULT_EDITOR_PREFERENCES,
    );
  });

  it("returns the parsed value when valid", () => {
    const stored = {
      fontSize: 18,
      tabSize: 8,
      wordWrap: false,
      minimap: true,
      theme: "github-dark",
    };
    expect(parseEditorPreferences(stored)).toEqual(stored);
  });
});
