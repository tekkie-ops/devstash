import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { CollectionCard } from "@/components/dashboard/CollectionCard";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { getAllCollections } from "@/lib/db/collections";
import { COLLECTIONS_PER_PAGE, getTotalPages, parsePage } from "@/lib/pagination";

export default async function CollectionsPage({
  searchParams,
}: PageProps<"/collections">) {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  const { collections, totalCount } = await getAllCollections(userId, page);
  const totalPages = getTotalPages(totalCount, COLLECTIONS_PER_PAGE);

  if (totalCount > 0 && page > totalPages) {
    notFound();
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl font-semibold">Collections</h1>
        <p className="text-muted-foreground">
          {totalCount} {totalCount === 1 ? "collection" : "collections"}
        </p>
      </header>

      {collections.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No collections yet.</p>
      )}

      <PaginationControls
        currentPage={page}
        totalPages={totalPages}
        basePath="/collections"
      />

      <Link
        href="/dashboard"
        className="text-sm text-primary underline-offset-4 hover:underline"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
