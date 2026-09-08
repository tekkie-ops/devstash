"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy } from "lucide-react";
import { toast } from "sonner";

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
}

export function MarkdownEditor({
  value,
  onChange,
  readOnly = false,
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<"write" | "preview">(
    readOnly ? "preview" : "write",
  );

  const activeTab = readOnly ? "preview" : tab;

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
        {readOnly && (
          <span className="px-1.5 text-xs font-medium text-muted-foreground">
            Preview
          </span>
        )}

        <button
          type="button"
          onClick={handleCopy}
          className="ml-auto inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
        >
          <Copy className="size-3.5" />
          Copy
        </button>
      </div>

      {activeTab === "write" && !readOnly ? (
        <MarkdownTextarea value={value} onChange={onChange} />
      ) : (
        <MarkdownPreview value={value} />
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
