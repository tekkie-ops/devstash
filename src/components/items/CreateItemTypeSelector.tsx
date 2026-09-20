"use client";

import { ItemTypeIcon } from "@/components/dashboard/ItemTypeIcon";
import type { CollectionItemType } from "@/lib/db/collections";
import { cn } from "@/lib/utils";

interface CreateItemTypeSelectorProps {
  types: CollectionItemType[];
  value: string;
  onChange: (name: string) => void;
}

/** The type-toggle button row at the top of the New Item dialog. */
export function CreateItemTypeSelector({
  types,
  value,
  onChange,
}: CreateItemTypeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {types.map((type) => {
        const selected = value === type.name;
        return (
          <button
            key={type.id}
            type="button"
            onClick={() => onChange(type.name)}
            aria-pressed={selected}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors",
              selected
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            <ItemTypeIcon type={type} />
            {type.label}
          </button>
        );
      })}
    </div>
  );
}
