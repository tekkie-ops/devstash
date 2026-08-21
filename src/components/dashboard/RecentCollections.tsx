import Link from "next/link";

import { CollectionCard } from "@/components/dashboard/CollectionCard";
import { getRecentCollections } from "@/lib/db/collections";

const RECENT_COLLECTION_LIMIT = 6;

export async function RecentCollections() {
  const recentCollections = await getRecentCollections(RECENT_COLLECTION_LIMIT);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-semibold">Collections</h2>
        <Link
          href="/collections"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          View all
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {recentCollections.map((collection) => (
          <CollectionCard key={collection.id} collection={collection} />
        ))}
      </div>
    </section>
  );
}
