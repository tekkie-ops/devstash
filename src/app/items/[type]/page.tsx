import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { ItemTypeIcon } from "@/components/dashboard/ItemTypeIcon";
import { FileListRow } from "@/components/items/FileListRow";
import { ImageThumbnailCard } from "@/components/items/ImageThumbnailCard";
import { ItemCard } from "@/components/items/ItemCard";
import { ItemDrawerProvider } from "@/components/items/ItemDrawerProvider";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { getCollectionsForSelect } from "@/lib/db/collections";
import { getItemsByTypeSlug } from "@/lib/db/items";
import { getTotalPages, ITEMS_PER_PAGE, parsePage } from "@/lib/pagination";

export default async function ItemsByTypePage({
  params,
  searchParams,
}: PageProps<"/items/[type]">) {
  const { type: slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const session = await auth();
  const userId = session?.user?.id;

  const [result, availableCollections] = await Promise.all([
    getItemsByTypeSlug(slug, page),
    userId ? getCollectionsForSelect(userId) : Promise.resolve([]),
  ]);

  if (!result) {
    notFound();
  }

  const { type, items, totalCount } = result;
  const totalPages = getTotalPages(totalCount, ITEMS_PER_PAGE);

  if (totalCount > 0 && page > totalPages) {
    notFound();
  }

  const isImageType = type.name === "image";
  const isFileType = type.name === "file";

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 font-heading text-3xl font-semibold">
          <ItemTypeIcon type={type} className="size-6" />
          {type.label}
        </h1>
        <p className="text-muted-foreground">
          {totalCount} {totalCount === 1 ? "item" : "items"}
        </p>
      </header>

      {items.length > 0 ? (
        <ItemDrawerProvider availableCollections={availableCollections}>
          {isFileType ? (
            <div className="divide-y overflow-hidden rounded-xl border bg-card">
              {items.map((item) => (
                <FileListRow key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) =>
                isImageType ? (
                  <ImageThumbnailCard key={item.id} item={item} />
                ) : (
                  <ItemCard key={item.id} item={item} />
                ),
              )}
            </div>
          )}
        </ItemDrawerProvider>
      ) : (
        <p className="text-sm text-muted-foreground">
          No {type.label.toLowerCase()} yet.
        </p>
      )}

      <PaginationControls
        currentPage={page}
        totalPages={totalPages}
        basePath={`/items/${slug}`}
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
