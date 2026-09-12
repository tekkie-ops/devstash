"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { CommandPalette } from "@/components/search/CommandPalette";
import type { SearchableCollection } from "@/lib/db/collections";
import type { SearchableItem } from "@/lib/db/items";

interface SearchPaletteContextValue {
  /** Open the command palette (e.g. from the TopBar's search trigger). */
  openPalette: () => void;
}

const SearchPaletteContext = createContext<SearchPaletteContextValue | null>(
  null,
);

export function useSearchPalette(): SearchPaletteContextValue {
  const context = useContext(SearchPaletteContext);
  if (!context) {
    throw new Error("useSearchPalette must be used within a SearchProvider");
  }
  return context;
}

/**
 * Owns the command palette's open state and the global Cmd/Ctrl+K shortcut.
 * `items`/`collections` are pre-fetched once by the dashboard layout — cmdk
 * filters them entirely client-side, no round-trip per keystroke. Mounted
 * once so any descendant (the TopBar's search trigger) can open the palette
 * via `useSearchPalette()`; must be nested inside an `ItemDrawerProvider`
 * since selecting an item result opens it in that drawer.
 */
export function SearchProvider({
  items,
  collections,
  children,
}: {
  items: SearchableItem[];
  collections: SearchableCollection[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const openPalette = useCallback(() => setOpen(true), []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((isOpen) => !isOpen);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <SearchPaletteContext.Provider value={{ openPalette }}>
      {children}
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        items={items}
        collections={collections}
      />
    </SearchPaletteContext.Provider>
  );
}
