import { Pin, Star } from "lucide-react";

import { ItemTypeTile } from "@/components/dashboard/ItemTypeIcon";
import { Badge } from "@/components/ui/badge";
import { formatItemDate } from "@/lib/dashboard";
import type { ItemSummary } from "@/lib/db/items";

/**
 * Not clickable yet — items open in the quick-access drawer, which is a later
 * feature. Row accent is the item's type color.
 */
export function ItemRow({ item }: { item: ItemSummary }) {
  return (
    <article
      className="flex items-start gap-3 rounded-xl border border-l-2 bg-card p-4 transition-colors hover:bg-accent/40"
      style={{ borderLeftColor: item.type.color }}
    >
      <ItemTypeTile type={item.type} />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-medium">{item.title}</h3>
          {item.isPinned && (
            <Pin
              aria-label="Pinned"
              className="size-3.5 shrink-0 text-muted-foreground"
            />
          )}
          {item.isFavorite && (
            <Star
              aria-label="Favorite"
              className="size-3.5 shrink-0 fill-amber-400 text-amber-400"
            />
          )}
        </div>

        <p className="truncate text-sm text-muted-foreground">
          {item.description}
        </p>

        {item.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {item.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <time
        dateTime={item.updatedAt.toISOString()}
        className="shrink-0 text-xs text-muted-foreground"
      >
        {formatItemDate(item.updatedAt)}
      </time>
    </article>
  );
}
