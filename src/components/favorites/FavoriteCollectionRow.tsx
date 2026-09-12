import Link from "next/link";
import { Folder } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatItemDate } from "@/lib/dashboard";
import type { CollectionSummary } from "@/lib/db/collections";

/** A single row in the /favorites collections list — compact, terminal-style, links to the collection. */
export function FavoriteCollectionRow({
  collection,
}: {
  collection: CollectionSummary;
}) {
  return (
    <Link
      href={`/collections/${collection.id}`}
      className="flex w-full items-center gap-3 px-1 py-1.5 font-mono text-sm transition-colors hover:bg-accent/40"
    >
      <Folder className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate">{collection.name}</span>
      <Badge variant="outline" className="shrink-0 font-mono text-[0.7rem]">
        Collection
      </Badge>
      <time
        dateTime={collection.updatedAt.toISOString()}
        className="w-14 shrink-0 text-right text-xs text-muted-foreground"
      >
        {formatItemDate(collection.updatedAt)}
      </time>
    </Link>
  );
}
