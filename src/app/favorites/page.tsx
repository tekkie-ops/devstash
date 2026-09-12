import Link from "next/link";
import { Star } from "lucide-react";

import { auth } from "@/auth";
import { FavoriteCollectionRow } from "@/components/favorites/FavoriteCollectionRow";
import { FavoriteItemRow } from "@/components/favorites/FavoriteItemRow";
import { ItemDrawerProvider } from "@/components/items/ItemDrawerProvider";
import {
  getCollectionsForSelect,
  getFavoriteCollections,
} from "@/lib/db/collections";
import { getFavoriteItems } from "@/lib/db/items";

/** Safety cap on the page's two sections — not paginated, per the feature spec. */
const FAVORITES_LIMIT = 500;

export default async function FavoritesPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  const [items, collections, availableCollections] = await Promise.all([
    getFavoriteItems(userId, FAVORITES_LIMIT),
    getFavoriteCollections(userId, FAVORITES_LIMIT),
    getCollectionsForSelect(userId),
  ]);

  const isEmpty = items.length === 0 && collections.length === 0;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <header className="flex items-center gap-2">
        <Star className="size-6 fill-amber-400 text-amber-400" />
        <h1 className="font-heading text-3xl font-semibold">Favorites</h1>
      </header>

      {isEmpty ? (
        <p className="font-mono text-sm text-muted-foreground">
          No favorites yet. Star an item or collection to see it here.
        </p>
      ) : (
        <ItemDrawerProvider availableCollections={availableCollections}>
          <section className="flex flex-col gap-2">
            <h2 className="font-mono text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Items ({items.length})
            </h2>
            {items.length > 0 ? (
              <div className="flex flex-col divide-y divide-border">
                {items.map((item) => (
                  <FavoriteItemRow key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <p className="font-mono text-sm text-muted-foreground">
                No favorited items.
              </p>
            )}
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="font-mono text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Collections ({collections.length})
            </h2>
            {collections.length > 0 ? (
              <div className="flex flex-col divide-y divide-border">
                {collections.map((collection) => (
                  <FavoriteCollectionRow
                    key={collection.id}
                    collection={collection}
                  />
                ))}
              </div>
            ) : (
              <p className="font-mono text-sm text-muted-foreground">
                No favorited collections.
              </p>
            )}
          </section>
        </ItemDrawerProvider>
      )}

      <Link
        href="/dashboard"
        className="text-sm text-primary underline-offset-4 hover:underline"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
