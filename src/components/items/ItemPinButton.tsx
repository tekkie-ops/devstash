"use client";

import { Pin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToggleItemPin } from "@/hooks/use-toggle-item-pin";
import type { ItemDetail } from "@/lib/db/items";
import { cn } from "@/lib/utils";

/**
 * Pin toggle for the item drawer's action bar — optimistically flips before
 * the server responds so pinning feels instant. Mirrors ItemFavoriteButton's
 * shape but takes the full detail (rather than itemId + isPinned) since the
 * optimistic update needs the whole object to revert on failure.
 */
export function ItemPinButton({
  detail,
  showLabel = false,
  className,
  onToggled,
}: {
  detail: ItemDetail;
  showLabel?: boolean;
  className?: string;
  onToggled?: (detail: ItemDetail) => void;
}) {
  const { pending, toggle } = useToggleItemPin(onToggled);

  return (
    <Button
      type="button"
      variant="ghost"
      size={showLabel ? "sm" : "icon-sm"}
      aria-label={detail.isPinned ? "Unpin item" : "Pin item"}
      title={
        showLabel ? undefined : detail.isPinned ? "Unpin item" : "Pin item"
      }
      disabled={pending}
      className={className}
      onClick={() => void toggle(detail)}
    >
      <Pin
        className={cn(
          "size-4",
          detail.isPinned && "fill-foreground text-foreground",
        )}
      />
      {showLabel && "Pin"}
    </Button>
  );
}
