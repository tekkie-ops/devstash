"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Crown, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { optimizePrompt } from "@/actions/ai";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Markdown editor with Write/Preview tabs. Used for the free-text body of
 * `note` and `prompt` items in place of a plain <Textarea> (snippets and
 * commands keep the Monaco <CodeEditor>).
 *
 * - Edit mode: both tabs, defaulting to Write.
 * - Read-only mode: Preview only, no Write tab.
 *
 * Container / header styling mirrors <CodeEditor>; the rendered Markdown is
 * styled through the `.markdown-preview` class in globals.css so dark-mode
 * colors stay reliable.
 */

const MAX_HEIGHT = 400;

interface MarkdownEditorProps {
  value: string;
  /** Omit for a read-only (display) editor. */
  onChange?: (value: string) => void;
  readOnly?: boolean;
  /**
   * Shows the Pro-gated "Optimize" trigger and, once generated, an
   * Original/Optimized comparison with accept/discard actions. Only passed
   * by the item drawer's read-only view for `prompt`-type items — not the
   * create dialog or edit form, mirroring <CodeEditor>'s `explainable`.
   */
  optimizable?: boolean;
  /** Whether the signed-in user can actually use Optimize (UI-only gate; the server action re-checks). */
  isPro?: boolean;
  /**
   * Called with the optimized text when the user accepts it; the caller
   * persists it. Return (or resolve) `false` to keep the accept panel open
   * on failure — anything else (including void) is treated as success.
   */
  onAcceptOptimized?: (
    optimized: string,
  ) => boolean | void | Promise<boolean | void>;
}

export function MarkdownEditor({
  value,
  onChange,
  readOnly = false,
  optimizable = false,
  isPro = false,
  onAcceptOptimized,
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<"write" | "preview">(
    readOnly ? "preview" : "write",
  );
  const [view, setView] = useState<"content" | "optimized">("content");
  const [optimized, setOptimized] = useState<string | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [accepting, setAccepting] = useState(false);

  const activeTab = readOnly ? "preview" : tab;
  const displayedValue = view === "optimized" && optimized ? optimized : value;

  const handleCopy = useCallback(() => {
    if (!displayedValue) {
      toast.error("Nothing to copy");
      return;
    }
    void navigator.clipboard
      .writeText(displayedValue)
      .then(() => toast.success("Copied to clipboard"))
      .catch(() => toast.error("Couldn't copy to clipboard"));
  }, [displayedValue]);

  const handleOptimize = useCallback(async () => {
    if (optimizing || !value.trim()) return;
    setOptimizing(true);
    const result = await optimizePrompt({ content: value });
    setOptimizing(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setOptimized(result.data.optimized);
    setView("optimized");
  }, [optimizing, value]);

  const handleDiscardOptimized = useCallback(() => {
    setOptimized(null);
    setView("content");
  }, []);

  const handleAcceptOptimized = useCallback(async () => {
    if (!optimized || accepting) return;
    setAccepting(true);
    const result = await onAcceptOptimized?.(optimized);
    setAccepting(false);
    if (result === false) return;
    setOptimized(null);
    setView("content");
  }, [optimized, accepting, onAcceptOptimized]);

  return (
    <div className="overflow-hidden rounded-lg border bg-[#1e1e1e]">
      <div className="flex items-center gap-1 border-b border-white/10 bg-[#2d2d2d] px-2 py-1.5">
        {!readOnly && (
          <div className="flex items-center gap-1">
            <TabButton
              active={activeTab === "write"}
              onClick={() => setTab("write")}
            >
              Write
            </TabButton>
            <TabButton
              active={activeTab === "preview"}
              onClick={() => setTab("preview")}
            >
              Preview
            </TabButton>
          </div>
        )}
        {readOnly && !optimized && (
          <span className="px-1.5 text-xs font-medium text-muted-foreground">
            Preview
          </span>
        )}
        {readOnly && optimized && (
          <div className="flex items-center gap-1">
            <TabButton
              active={view === "content"}
              onClick={() => setView("content")}
            >
              Original
            </TabButton>
            <TabButton
              active={view === "optimized"}
              onClick={() => setView("optimized")}
            >
              Optimized
            </TabButton>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
          >
            <Copy className="size-3.5" />
            Copy
          </button>
          {optimizable &&
            (isPro ? (
              <button
                type="button"
                onClick={handleOptimize}
                disabled={optimizing || !value.trim()}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
              >
                {optimizing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                {optimizing ? "Optimizing…" : "Optimize"}
              </button>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {/* aria-disabled, not the disabled attribute — a natively
                        disabled button fires no pointer/focus events, so the
                        tooltip would never open (same fix as <CodeEditor>'s
                        Explain gating). */}
                    <button
                      type="button"
                      aria-disabled="true"
                      className="inline-flex cursor-not-allowed items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground opacity-70"
                    >
                      <Crown className="size-3.5" />
                      Optimize
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    AI features require Pro subscription
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
        </div>
      </div>

      {activeTab === "write" && !readOnly ? (
        <MarkdownTextarea value={value} onChange={onChange} />
      ) : (
        <MarkdownPreview value={displayedValue} />
      )}

      {readOnly && optimized && view === "optimized" && (
        <div className="flex items-center justify-end gap-2 border-t border-white/10 bg-[#2d2d2d] px-3 py-2">
          <span className="mr-auto text-xs text-muted-foreground">
            Use this optimized prompt?
          </span>
          <button
            type="button"
            onClick={handleDiscardOptimized}
            disabled={accepting}
            className="rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={handleAcceptOptimized}
            disabled={accepting}
            className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
          >
            {accepting ? "Saving…" : "Use this prompt"}
          </button>
        </div>
      )}
    </div>
  );
}

function TabButton({
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

function MarkdownTextarea({
  value,
  onChange,
}: {
  value: string;
  onChange?: (value: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [value, resize]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(event) => {
        onChange?.(event.target.value);
        resize();
      }}
      spellCheck={false}
      placeholder="Write Markdown…"
      className="block max-h-[400px] min-h-24 w-full resize-none bg-[#1e1e1e] px-4 py-3 font-mono text-xs leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
    />
  );
}

function MarkdownPreview({ value }: { value: string }) {
  if (!value.trim()) {
    return (
      <div className="px-4 py-3 text-xs text-muted-foreground">
        Nothing to preview.
      </div>
    );
  }

  return (
    <div className="markdown-preview max-h-[400px] overflow-y-auto px-4 py-3">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
    </div>
  );
}
