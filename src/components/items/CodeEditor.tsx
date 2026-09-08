"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Copy } from "lucide-react";
import { toast } from "sonner";

import type { BeforeMount, OnChange, OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

/**
 * Monaco Editor, loaded on the client only. Used for code-bearing item types
 * (snippets, commands) in place of a plain <Textarea>. Renders a macOS-style
 * window header with the language label and a quick copy button, and grows with
 * its content up to a fixed max height, past which Monaco's own themed
 * scrollbar takes over.
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
const THEME_NAME = "devstash-dark";

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
    monaco.editor.defineTheme(THEME_NAME, {
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
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 13,
      lineHeight: 20,
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
      tabSize: 2,
      wordWrap: "off",
    }),
    [readOnly],
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
        theme={THEME_NAME}
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
