"use client";

import { Search } from "lucide-react";

import { useSearchPalette } from "@/components/search/SearchProvider";

/**
 * The TopBar's search field, styled to match the old display-only `Input`
 * but rendered as a button — clicking (or Cmd/Ctrl+K, handled globally by
 * `SearchProvider`) opens the command palette rather than accepting typed
 * text itself.
 */
export function SearchTrigger() {
  const { openPalette } = useSearchPalette();

  return (
    <button
      type="button"
      onClick={openPalette}
      aria-haspopup="dialog"
      className="flex h-8 w-full max-w-md items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-base text-muted-foreground outline-none transition-colors hover:border-ring/50 md:text-sm"
    >
      <Search className="size-4 shrink-0" aria-hidden="true" />
      <span className="flex-1 truncate text-left">
        Search items and collections...
      </span>
      <kbd className="pointer-events-none hidden shrink-0 select-none rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:block">
        ⌘K
      </kbd>
    </button>
  );
}
