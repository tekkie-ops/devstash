import { ItemTypeTile } from "@/components/dashboard/ItemTypeIcon";
import { CopyItemButton } from "@/components/items/CopyItemButton";
import { ItemDrawerTrigger } from "@/components/items/ItemDrawerTrigger";
import { ItemFavoriteButton } from "@/components/items/ItemFavoriteButton";
import { ItemStatusIcons } from "@/components/items/ItemStatusIcons";
import { Badge } from "@/components/ui/badge";
import { formatItemDate } from "@/lib/dashboard";
import type { ItemSummary } from "@/lib/db/items";

/**
 * Grid card for the items list view. Clicking it opens the item drawer
 * (detail view) — see ItemDrawerProvider. Left border = the item's type color.
 */
export function ItemCard({ item }: { item: ItemSummary }) {
  const copyText = item.content ?? item.url;

  return (
    <div className="relative h-full">
      <ItemDrawerTrigger
        itemId={item.id}
        className="block h-full w-full cursor-pointer text-left"
      >
        <article
          className="flex h-full flex-col gap-3 rounded-xl border border-l-2 bg-card p-4 transition-colors hover:bg-accent/40"
          style={{ borderLeftColor: item.type.color }}
        >
          <div className="flex items-start gap-3">
            <ItemTypeTile type={item.type} />

            <div className="flex min-w-0 flex-1 flex-col pr-7">
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

          {item.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {item.description}
            </p>
          )}

          {item.tags.length > 0 && (
            <div className="mt-auto flex flex-wrap items-center gap-1.5 pr-8">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </article>
      </ItemDrawerTrigger>

      <ItemFavoriteButton
        itemId={item.id}
        isFavorite={item.isFavorite}
        className="absolute top-2.5 right-2.5 text-muted-foreground hover:text-foreground"
      />

      {copyText && (
        <CopyItemButton
          text={copyText}
          className="absolute right-2.5 bottom-2.5 text-muted-foreground hover:text-foreground"
        />
      )}
    </div>
  );
}
