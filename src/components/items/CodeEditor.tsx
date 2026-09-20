"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Copy, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

import type { BeforeMount, OnChange, OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

import { explainCode } from "@/actions/ai";
import { useEditorPreferences } from "@/components/settings/EditorPreferencesContext";
import { defineCodeEditorThemes, MONACO_THEME_NAMES } from "@/components/items/codeEditorThemes";
import { EditorAiActionButton } from "@/components/items/EditorAiActionButton";
import { toMonacoLanguage } from "@/lib/languages";
import { cn } from "@/lib/utils";

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

interface CodeEditorProps {
  value: string;
  language?: string | null;
  /** Omit for a read-only (display) editor. */
  onChange?: (value: string) => void;
  readOnly?: boolean;
  /**
   * Shows the Pro-gated "Explain" trigger and, once generated, Code/Explain
   * tabs. Only passed by the item drawer's read-only view — not the create
   * dialog or edit form.
   */
  explainable?: boolean;
  /** Whether the signed-in user can actually use Explain (UI-only gate; the server action re-checks). */
  isPro?: boolean;
}

export function CodeEditor({
  value,
  language,
  onChange,
  readOnly = false,
  explainable = false,
  isPro = false,
}: CodeEditorProps) {
  const { preferences } = useEditorPreferences();
  const [height, setHeight] = useState(MIN_HEIGHT);
  const [view, setView] = useState<"code" | "explain">("code");
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);

  const displayLanguage = language?.trim() || null;
  const monacoLanguage = toMonacoLanguage(language);

  const handleCopy = useCallback(() => {
    const textToCopy = view === "explain" && explanation ? explanation : value;
    if (!textToCopy) {
      toast.error("Nothing to copy");
      return;
    }
    void navigator.clipboard
      .writeText(textToCopy)
      .then(() => toast.success("Copied to clipboard"))
      .catch(() => toast.error("Couldn't copy to clipboard"));
  }, [view, explanation, value]);

  const handleExplain = useCallback(async () => {
    if (explaining || !value.trim()) return;
    setExplaining(true);
    const result = await explainCode({ content: value, language });
    setExplaining(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setExplanation(result.data.explanation);
    setView("explain");
  }, [explaining, value, language]);

  const handleChange = useCallback<OnChange>(
    (next) => onChange?.(next ?? ""),
    [onChange],
  );

  const handleBeforeMount = useCallback<BeforeMount>((monaco) => {
    defineCodeEditorThemes(monaco);
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
          {explanation ? (
            <div className="flex items-center gap-1">
              <ViewTabButton
                active={view === "code"}
                onClick={() => setView("code")}
              >
                Code
              </ViewTabButton>
              <ViewTabButton
                active={view === "explain"}
                onClick={() => setView("explain")}
              >
                Explain
              </ViewTabButton>
            </div>
          ) : (
            displayLanguage && (
              <span className="font-mono text-xs text-muted-foreground">
                {displayLanguage}
              </span>
            )
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
          >
            <Copy className="size-3.5" />
            Copy
          </button>
          {explainable && (
            <EditorAiActionButton
              icon={Sparkles}
              label="Explain"
              loadingLabel="Explaining…"
              loading={explaining}
              disabled={explaining || !value.trim()}
              onClick={handleExplain}
              isPro={isPro}
            />
          )}
        </div>
      </div>

      {view === "explain" && explanation ? (
        <div
          className="markdown-preview max-h-[400px] overflow-y-auto bg-[#0d0d0d] px-4 py-3"
          style={{ minHeight: height }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {explanation}
          </ReactMarkdown>
        </div>
      ) : (
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
      )}
    </div>
  );
}

function ViewTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-md px-2 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-white/10 text-foreground"
          : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function EditorLoading() {
  return (
    <div className="flex h-24 items-center justify-center bg-[#0d0d0d] text-xs text-muted-foreground">
      Loading editor…
    </div>
  );
}
