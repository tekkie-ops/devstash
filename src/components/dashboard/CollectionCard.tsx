import Link from "next/link";
import { Star } from "lucide-react";

import { ItemTypeIcon } from "@/components/dashboard/ItemTypeIcon";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { collectionTypes, itemsInCollection } from "@/lib/dashboard";
import type { Collection } from "@/lib/mock-data";

/** Card accent is the collection's dominant item type — see ItemTypeIcon on inline colors. */
export function CollectionCard({ collection }: { collection: Collection }) {
  const itemCount = itemsInCollection(collection.id).length;
  const types = collectionTypes(collection.id);
  const dominantType = types[0];

  return (
    <Link href={`/collections/${collection.id}`} className="block">
      <Card
        className="h-full border-l-2 transition-colors hover:bg-accent/40"
        style={dominantType ? { borderLeftColor: dominantType.color } : undefined}
      >
        <CardHeader>
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
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {collection.description}
          </p>
          <div className="flex items-center gap-2">
            {types.map((type) => (
              <ItemTypeIcon key={type.id} type={type} />
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
