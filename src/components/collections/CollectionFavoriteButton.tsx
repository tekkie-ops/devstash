"use client";

import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToggleCollectionFavorite } from "@/hooks/use-toggle-collection-favorite";
import type { CollectionSummary } from "@/lib/db/collections";
import { cn } from "@/lib/utils";

/**
 * Favorite toggle for a collection — icon-only when overlaid on a card (an
 * absolutely positioned sibling of the card's Link, same reasoning as
 * CollectionActionsMenu, so clicking it doesn't navigate), labeled when used
 * inline on the /collections/[id] detail page's action row.
 */
export function CollectionFavoriteButton({
  collection,
  showLabel = false,
  className,
}: {
  collection: CollectionSummary;
  showLabel?: boolean;
  className?: string;
}) {
  const { pending, toggle } = useToggleCollectionFavorite();

  return (
    <Button
      type="button"
      variant="ghost"
      size={showLabel ? "sm" : "icon-sm"}
      aria-label={
        collection.isFavorite ? "Remove from favorites" : "Add to favorites"
      }
      title={
        showLabel
          ? undefined
          : collection.isFavorite
            ? "Remove from favorites"
            : "Add to favorites"
      }
      disabled={pending}
      className={className}
      onClick={() => void toggle(collection.id)}
    >
      <Star
        className={cn(
          "size-4",
          collection.isFavorite && "fill-amber-400 text-amber-400",
        )}
      />
      {showLabel && "Favorite"}
    </Button>
  );
}
