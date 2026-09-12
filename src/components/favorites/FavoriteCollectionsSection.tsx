"use client";

import { useMemo, useState } from "react";

import { FavoriteCollectionRow } from "@/components/favorites/FavoriteCollectionRow";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CollectionSummary } from "@/lib/db/collections";

type SortBy = "date" | "name";

function sortCollections(
  collections: CollectionSummary[],
  sortBy: SortBy,
): CollectionSummary[] {
  const sorted = [...collections];

  switch (sortBy) {
    case "name":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "date":
    default:
      sorted.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      break;
  }

  return sorted;
}

/** The /favorites Collections section — owns client-side sort state (Name/Date). */
export function FavoriteCollectionsSection({
  collections,
}: {
  collections: CollectionSummary[];
}) {
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const sortedCollections = useMemo(
    () => sortCollections(collections, sortBy),
    [collections, sortBy],
  );

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Collections ({collections.length})
        </h2>
        {collections.length > 0 && (
          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as SortBy)}
          >
            <SelectTrigger size="sm" aria-label="Sort collections by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
      {sortedCollections.length > 0 ? (
        <div className="flex flex-col divide-y divide-border">
          {sortedCollections.map((collection) => (
            <FavoriteCollectionRow key={collection.id} collection={collection} />
          ))}
        </div>
      ) : (
        <p className="font-mono text-sm text-muted-foreground">
          No favorited collections.
        </p>
      )}
    </section>
  );
}
