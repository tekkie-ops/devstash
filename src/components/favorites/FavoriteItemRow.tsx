import { ItemTypeIcon } from "@/components/dashboard/ItemTypeIcon";
import { ItemDrawerTrigger } from "@/components/items/ItemDrawerTrigger";
import { Badge } from "@/components/ui/badge";
import { formatItemDate } from "@/lib/dashboard";
import type { ItemSummary } from "@/lib/db/items";

/** A single row in the /favorites items list — compact, terminal-style, opens the item drawer. */
export function FavoriteItemRow({ item }: { item: ItemSummary }) {
  return (
    <ItemDrawerTrigger
      itemId={item.id}
      className="flex w-full items-center gap-3 px-1 py-1.5 text-left font-mono text-sm transition-colors hover:bg-accent/40"
    >
      <ItemTypeIcon type={item.type} />
      <span className="min-w-0 flex-1 truncate">{item.title}</span>
      <Badge variant="outline" className="shrink-0 font-mono text-[0.7rem]">
        {item.type.label}
      </Badge>
      <time
        dateTime={item.updatedAt.toISOString()}
        className="w-14 shrink-0 text-right text-xs text-muted-foreground"
      >
        {formatItemDate(item.updatedAt)}
      </time>
    </ItemDrawerTrigger>
  );
}
