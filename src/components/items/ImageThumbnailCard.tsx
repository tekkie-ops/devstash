import { ImageOff } from "lucide-react";

import { ItemDrawerTrigger } from "@/components/items/ItemDrawerTrigger";
import { ItemStatusIcons } from "@/components/items/ItemStatusIcons";
import { formatItemDate } from "@/lib/dashboard";
import type { ItemSummary } from "@/lib/db/items";

/**
 * Grid card for `image`-type items in the items list view — replaces
 * ItemCard's type tile / description layout with a 16:9 thumbnail. Clicking
 * it opens the item drawer, same as ItemCard.
 */
export function ImageThumbnailCard({ item }: { item: ItemSummary }) {
  return (
    <ItemDrawerTrigger
      itemId={item.id}
      className="group block h-full w-full cursor-pointer text-left"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:bg-accent/40">
        <div className="aspect-video w-full overflow-hidden bg-muted">
          {item.fileUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.fileUrl}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImageOff className="size-8" />
            </div>
          )}
        </div>

        <div className="flex items-start gap-2 p-3">
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-medium">{item.title}</h3>
              <ItemStatusIcons
                isPinned={item.isPinned}
                isFavorite={item.isFavorite}
              />
            </div>

            <time
              dateTime={item.updatedAt.toISOString()}
              className="text-xs text-muted-foreground"
            >
              {formatItemDate(item.updatedAt)}
            </time>
          </div>
        </div>
      </article>
    </ItemDrawerTrigger>
  );
}
