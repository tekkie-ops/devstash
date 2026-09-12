"use client";

import { useMemo, useState } from "react";

import { FavoriteItemRow } from "@/components/favorites/FavoriteItemRow";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SYSTEM_TYPE_ORDER } from "@/lib/item-types";
import type { ItemSummary } from "@/lib/db/items";

type SortBy = "date" | "name" | "type";

function sortItems(items: ItemSummary[], sortBy: SortBy): ItemSummary[] {
  const sorted = [...items];

  switch (sortBy) {
    case "name":
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "type":
      sorted.sort((a, b) => {
        const typeDiff =
          SYSTEM_TYPE_ORDER.indexOf(a.type.name) -
          SYSTEM_TYPE_ORDER.indexOf(b.type.name);
        return typeDiff !== 0 ? typeDiff : a.title.localeCompare(b.title);
      });
      break;
    case "date":
    default:
      sorted.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      break;
  }

  return sorted;
}

/** The /favorites Items section — owns client-side sort state (Name/Date/Type). */
export function FavoriteItemsSection({ items }: { items: ItemSummary[] }) {
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const sortedItems = useMemo(() => sortItems(items, sortBy), [items, sortBy]);

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Items ({items.length})
        </h2>
        {items.length > 0 && (
          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as SortBy)}
          >
            <SelectTrigger size="sm" aria-label="Sort items by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="type">Item type</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
      {sortedItems.length > 0 ? (
        <div className="flex flex-col divide-y divide-border">
          {sortedItems.map((item) => (
            <FavoriteItemRow key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <p className="font-mono text-sm text-muted-foreground">
          No favorited items.
        </p>
      )}
    </section>
  );
}
