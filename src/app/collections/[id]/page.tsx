import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { CollectionDetailActions } from "@/components/collections/CollectionDetailActions";
import { ItemCard } from "@/components/items/ItemCard";
import { ItemDrawerProvider } from "@/components/items/ItemDrawerProvider";
import { PaginationControls } from "@/components/shared/PaginationControls";
import {
  getCollectionDetail,
  getCollectionsForSelect,
} from "@/lib/db/collections";
import { getItemsByCollectionId } from "@/lib/db/items";
import { getTotalPages, ITEMS_PER_PAGE, parsePage } from "@/lib/pagination";

export default async function CollectionDetailPage({
  params,
  searchParams,
}: PageProps<"/collections/[id]">) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  const collection = await getCollectionDetail(userId, id);

  if (!collection) {
    notFound();
  }

  const totalPages = getTotalPages(collection.itemCount, ITEMS_PER_PAGE);

  if (collection.itemCount > 0 && page > totalPages) {
    notFound();
  }

  const [items, availableCollections] = await Promise.all([
    getItemsByCollectionId(userId, id, page),
    getCollectionsForSelect(userId),
  ]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-heading text-3xl font-semibold">
            {collection.name}
          </h1>
          <CollectionDetailActions collection={collection} />
        </div>
        {collection.description && (
          <p className="text-muted-foreground">{collection.description}</p>
        )}
        <p className="text-sm text-muted-foreground">
          {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
        </p>
      </header>

      {items.length > 0 ? (
        <ItemDrawerProvider availableCollections={availableCollections}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </ItemDrawerProvider>
      ) : (
        <p className="text-sm text-muted-foreground">
          No items in this collection yet.
        </p>
      )}

      <PaginationControls
        currentPage={page}
        totalPages={totalPages}
        basePath={`/collections/${id}`}
      />

      <Link
        href="/collections"
        className="text-sm text-primary underline-offset-4 hover:underline"
      >
        Back to collections
      </Link>
    </div>
  );
}
