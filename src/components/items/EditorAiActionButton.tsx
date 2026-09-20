"use client";

import { Crown, Loader2, type LucideIcon } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EditorAiActionButtonProps {
  icon: LucideIcon;
  label: string;
  loadingLabel: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
  /** UI-only gate; the server action re-checks Pro status regardless. */
  isPro: boolean;
}

/**
 * Pro-gated AI action trigger shared by <CodeEditor>'s Explain button and
 * <MarkdownEditor>'s Optimize button. Free users see a Crown icon inside a
 * tooltip instead of the active button.
 */
export function EditorAiActionButton({
  icon: Icon,
  label,
  loadingLabel,
  loading,
  disabled,
  onClick,
  isPro,
}: EditorAiActionButtonProps) {
  if (!isPro) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {/* aria-disabled, not the disabled attribute — a natively
                disabled button fires no pointer/focus events, so the
                tooltip would never open. There's no onClick handler here
                regardless, so it's already inert either way. */}
            <button
              type="button"
              aria-disabled="true"
              className="inline-flex cursor-not-allowed items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground opacity-70"
            >
              <Crown className="size-3.5" />
              {label}
            </button>
          </TooltipTrigger>
          <TooltipContent>AI features require Pro subscription</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Icon className="size-3.5" />
      )}
      {loading ? loadingLabel : label}
    </button>
  );
}
