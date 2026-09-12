import Link from "next/link";

import { CollectionCard } from "@/components/dashboard/CollectionCard";
import { auth } from "@/auth";
import { getRecentCollections } from "@/lib/db/collections";
import { DASHBOARD_COLLECTIONS_LIMIT } from "@/lib/pagination";

export async function RecentCollections() {
  const session = await auth();
  const userId = session?.user?.id;

  const recentCollections = userId
    ? await getRecentCollections(userId, DASHBOARD_COLLECTIONS_LIMIT)
    : [];

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
