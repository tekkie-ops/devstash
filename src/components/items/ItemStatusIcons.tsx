import { Pin, Star } from "lucide-react";

/**
 * The pinned/favorite indicator pair shown next to an item's title. Shared by
 * every item list surface (ItemRow, ItemCard, ImageThumbnailCard,
 * FileListRow) — previously copy-pasted identically in each.
 */
export function ItemStatusIcons({
  isPinned,
  isFavorite,
}: {
  isPinned: boolean;
  isFavorite: boolean;
}) {
  return (
    <>
      {isPinned && (
        <Pin
          aria-label="Pinned"
          className="size-3.5 shrink-0 text-muted-foreground"
        />
      )}
      {isFavorite && (
        <Star
          aria-label="Favorite"
          className="size-3.5 shrink-0 fill-amber-400 text-amber-400"
        />
      )}
    </>
  );
}
