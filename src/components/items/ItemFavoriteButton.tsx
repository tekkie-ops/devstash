"use client";

import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToggleItemFavorite } from "@/hooks/use-toggle-item-favorite";
import type { ItemDetail } from "@/lib/db/items";
import { cn } from "@/lib/utils";

/**
 * Favorite toggle for an item — icon-only when overlaid on a card (a sibling
 * of the card's drawer trigger, never nested inside it, same reasoning as
 * CopyItemButton, so clicking it doesn't open the drawer), labeled when used
 * inline in the drawer's action bar.
 */
export function ItemFavoriteButton({
  itemId,
  isFavorite,
  showLabel = false,
  className,
  onToggled,
}: {
  itemId: string;
  isFavorite: boolean;
  showLabel?: boolean;
  className?: string;
  onToggled?: (detail: ItemDetail) => void;
}) {
  const { pending, toggle } = useToggleItemFavorite(onToggled);

  return (
    <Button
      type="button"
      variant="ghost"
      size={showLabel ? "sm" : "icon-sm"}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      title={showLabel ? undefined : isFavorite ? "Remove from favorites" : "Add to favorites"}
      disabled={pending}
      className={className}
      onClick={() => void toggle(itemId)}
    >
      <Star
        className={cn("size-4", isFavorite && "fill-amber-400 text-amber-400")}
      />
      {showLabel && "Favorite"}
    </Button>
  );
}
