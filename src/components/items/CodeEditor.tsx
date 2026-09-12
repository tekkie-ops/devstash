"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Copy } from "lucide-react";
import { toast } from "sonner";

import type { BeforeMount, OnChange, OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

import { useEditorPreferences } from "@/components/settings/EditorPreferencesContext";
import type { EditorPreferences } from "@/lib/validations/editor-preferences";

/**
 * Monaco Editor, loaded on the client only. Used for code-bearing item types
 * (snippets, commands) in place of a plain <Textarea>. Renders a macOS-style
 * window header with the language label and a quick copy button, and grows with
 * its content up to a fixed max height, past which Monaco's own themed
 * scrollbar takes over. Font size, tab size, word wrap, minimap, and theme all
 * come from the signed-in user's EditorPreferencesContext (see /settings).
 *
 * The `monaco-editor` runtime is fetched from a CDN by `@monaco-editor/react`'s
 * default loader — worth revisiting if the app ever needs to run offline.
 */
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <EditorLoading />,
});

const MIN_HEIGHT = 96;
const MAX_HEIGHT = 400;

/** Maps an EditorPreferences theme id to the Monaco theme name defined in defineThemes. */
const MONACO_THEME_NAMES: Record<EditorPreferences["theme"], string> = {
  "vs-dark": "devstash-vs-dark",
  monokai: "devstash-monokai",
  "github-dark": "devstash-github-dark",
};

function defineThemes(monaco: Parameters<BeforeMount>[0]) {
  monaco.editor.defineTheme(MONACO_THEME_NAMES["vs-dark"], {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#0d0d0d",
      "editorGutter.background": "#0d0d0d",
      "editorLineNumber.foreground": "#4b4b4b",
      "editorLineNumber.activeForeground": "#a1a1a1",
      "editor.lineHighlightBackground": "#ffffff0a",
      "editor.lineHighlightBorder": "#00000000",
      "editorWidget.background": "#1a1a1a",
      "editorIndentGuide.background1": "#ffffff14",
      "scrollbar.shadow": "#00000000",
      "scrollbarSlider.background": "#ffffff1f",
      "scrollbarSlider.hoverBackground": "#ffffff33",
      "scrollbarSlider.activeBackground": "#ffffff4d",
    },
  });

  monaco.editor.defineTheme(MONACO_THEME_NAMES.monokai, {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "75715e" },
      { token: "string", foreground: "e6db74" },
      { token: "keyword", foreground: "f92672" },
      { token: "number", foreground: "ae81ff" },
      { token: "type", foreground: "66d9ef", fontStyle: "italic" },
      { token: "function", foreground: "a6e22e" },
      { token: "variable", foreground: "f8f8f2" },
    ],
    colors: {
      "editor.background": "#272822",
      "editorGutter.background": "#272822",
      "editorLineNumber.foreground": "#75715e",
      "editorLineNumber.activeForeground": "#f8f8f2",
      "editor.lineHighlightBackground": "#3e3d32",
      "editor.lineHighlightBorder": "#00000000",
      "editorWidget.background": "#3e3d32",
      "editorIndentGuide.background1": "#ffffff14",
      "scrollbar.shadow": "#00000000",
      "scrollbarSlider.background": "#ffffff1f",
      "scrollbarSlider.hoverBackground": "#ffffff33",
      "scrollbarSlider.activeBackground": "#ffffff4d",
    },
  });

  monaco.editor.defineTheme(MONACO_THEME_NAMES["github-dark"], {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "8b949e" },
      { token: "string", foreground: "a5d6ff" },
      { token: "keyword", foreground: "ff7b72" },
      { token: "number", foreground: "79c0ff" },
      { token: "type", foreground: "ffa657" },
      { token: "function", foreground: "d2a8ff" },
      { token: "variable", foreground: "c9d1d9" },
    ],
    colors: {
      "editor.background": "#0d1117",
      "editorGutter.background": "#0d1117",
      "editorLineNumber.foreground": "#6e7681",
      "editorLineNumber.activeForeground": "#c9d1d9",
      "editor.lineHighlightBackground": "#161b22",
      "editor.lineHighlightBorder": "#00000000",
      "editorWidget.background": "#161b22",
      "editorIndentGuide.background1": "#ffffff14",
      "scrollbar.shadow": "#00000000",
      "scrollbarSlider.background": "#ffffff1f",
      "scrollbarSlider.hoverBackground": "#ffffff33",
      "scrollbarSlider.activeBackground": "#ffffff4d",
    },
  });
}

/** Common shorthands → Monaco language ids. Unknown ids fall back to plaintext. */
const LANGUAGE_ALIASES: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  py: "python",
  rb: "ruby",
  yml: "yaml",
  md: "markdown",
  "c++": "cpp",
  "c#": "csharp",
  cs: "csharp",
  golang: "go",
};

function toMonacoLanguage(language: string | null | undefined): string {
  const key = language?.trim().toLowerCase();
  if (!key) return "plaintext";
  return LANGUAGE_ALIASES[key] ?? key;
}

interface CodeEditorProps {
  value: string;
  language?: string | null;
  /** Omit for a read-only (display) editor. */
  onChange?: (value: string) => void;
  readOnly?: boolean;
}

export function CodeEditor({
  value,
  language,
  onChange,
  readOnly = false,
}: CodeEditorProps) {
  const { preferences } = useEditorPreferences();
  const [height, setHeight] = useState(MIN_HEIGHT);

  const displayLanguage = language?.trim() || null;
  const monacoLanguage = toMonacoLanguage(language);

  const handleCopy = useCallback(() => {
    if (!value) {
      toast.error("Nothing to copy");
      return;
    }
    void navigator.clipboard
      .writeText(value)
      .then(() => toast.success("Copied to clipboard"))
      .catch(() => toast.error("Couldn't copy to clipboard"));
  }, [value]);

  const handleChange = useCallback<OnChange>(
    (next) => onChange?.(next ?? ""),
    [onChange],
  );

  const handleBeforeMount = useCallback<BeforeMount>((monaco) => {
    defineThemes(monaco);
  }, []);

  const handleMount = useCallback<OnMount>((editorInstance) => {
    const applyHeight = () => {
      const next = Math.min(
        MAX_HEIGHT,
        Math.max(MIN_HEIGHT, editorInstance.getContentHeight()),
      );
      setHeight(next);
    };
    editorInstance.onDidContentSizeChange(applyHeight);
    applyHeight();
  }, []);

  const options = useMemo<editor.IStandaloneEditorConstructionOptions>(
    () => ({
      readOnly,
      domReadOnly: readOnly,
      minimap: { enabled: preferences.minimap },
      scrollBeyondLastLine: false,
      fontSize: preferences.fontSize,
      lineHeight: Math.round(preferences.fontSize * 1.5),
      fontFamily: "var(--font-mono)",
      padding: { top: 12, bottom: 12 },
      renderLineHighlight: readOnly ? "none" : "line",
      overviewRulerLanes: 0,
      overviewRulerBorder: false,
      hideCursorInOverviewRuler: true,
      scrollbar: {
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
        alwaysConsumeMouseWheel: false,
      },
      automaticLayout: true,
      tabSize: preferences.tabSize,
      wordWrap: preferences.wordWrap ? "on" : "off",
    }),
    [readOnly, preferences.minimap, preferences.fontSize, preferences.tabSize, preferences.wordWrap],
  );

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="flex items-center gap-3 border-b border-white/10 bg-[#0d0d0d] px-3 py-2">
        <div className="flex gap-1.5" aria-hidden>
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="ml-auto flex items-center gap-2.5">
          {displayLanguage && (
            <span className="font-mono text-xs text-muted-foreground">
              {displayLanguage}
            </span>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
          >
            <Copy className="size-3.5" />
            Copy
          </button>
        </div>
      </div>

      <MonacoEditor
        height={height}
        theme={MONACO_THEME_NAMES[preferences.theme]}
        language={monacoLanguage}
        value={value}
        onChange={readOnly ? undefined : handleChange}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        options={options}
        loading={<EditorLoading />}
      />
    </div>
  );
}

function EditorLoading() {
  return (
    <div className="flex h-24 items-center justify-center bg-[#0d0d0d] text-xs text-muted-foreground">
      Loading editor…
    </div>
  );
}
