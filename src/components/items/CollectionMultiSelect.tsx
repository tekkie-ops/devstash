"use client";

import type { CollectionOption } from "@/lib/db/collections";
import { cn } from "@/lib/utils";

/**
 * Toggle-button collection picker shared by the New Item dialog and the item
 * drawer's edit form — same visual pattern as the Type selector in
 * CreateItemDialog. Selection is a plain array of collection ids so an item
 * can belong to zero, one, or many collections.
 */
export function CollectionMultiSelect({
  collections,
  selectedIds,
  onChange,
}: {
  collections: CollectionOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  if (collections.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No collections yet — create one from the dashboard.
      </p>
    );
  }

  function toggle(id: string) {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((existing) => existing !== id)
        : [...selectedIds, id],
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {collections.map((collection) => {
        const selected = selectedIds.includes(collection.id);
        return (
          <button
            key={collection.id}
            type="button"
            onClick={() => toggle(collection.id)}
            aria-pressed={selected}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm transition-colors",
              selected
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {collection.name}
          </button>
        );
      })}
    </div>
  );
}
