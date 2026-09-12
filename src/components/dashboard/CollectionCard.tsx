import Link from "next/link";
import { Star } from "lucide-react";

import { CollectionActionsMenu } from "@/components/collections/CollectionActionsMenu";
import { CollectionFavoriteButton } from "@/components/collections/CollectionFavoriteButton";
import { ItemTypeIcon } from "@/components/dashboard/ItemTypeIcon";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CollectionSummary } from "@/lib/db/collections";

/**
 * Card accent is the collection's dominant item type — see ItemTypeIcon on
 * inline colors. The favorite toggle and actions menu sit as an absolutely
 * positioned sibling of the Link (not nested inside it — same reasoning as
 * ItemCard's CopyItemButton), so they intercept their own clicks while the
 * rest of the card still navigates to the collection page.
 */
export function CollectionCard({
  collection,
}: {
  collection: CollectionSummary;
}) {
  const dominantType = collection.types[0];

  return (
    <div className="relative h-full">
      <Link href={`/collections/${collection.id}`} className="block h-full">
        <Card
          className="h-full border-l-2 transition-colors hover:bg-accent/40"
          style={dominantType ? { borderLeftColor: dominantType.color } : undefined}
        >
          <CardHeader className="pr-16">
            <CardTitle className="flex items-center gap-2">
              {collection.name}
              {collection.isFavorite && (
                <Star
                  aria-label="Favorite"
                  className="size-3.5 fill-amber-400 text-amber-400"
                />
              )}
            </CardTitle>
            <CardDescription>
              {collection.itemCount}{" "}
              {collection.itemCount === 1 ? "item" : "items"}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              {collection.description}
            </p>
            <div className="flex items-center gap-2">
              {collection.types.map((type) => (
                <ItemTypeIcon key={type.id} type={type} />
              ))}
            </div>
          </CardContent>
        </Card>
      </Link>

      <div className="absolute top-2 right-2 flex items-center gap-1">
        <CollectionFavoriteButton
          collection={collection}
          className="bg-card/80 text-muted-foreground hover:text-foreground"
        />
        <CollectionActionsMenu collection={collection} />
      </div>
    </div>
  );
}
