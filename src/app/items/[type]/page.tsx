import Link from "next/link";
import { notFound } from "next/navigation";

import { ItemTypeIcon } from "@/components/dashboard/ItemTypeIcon";
import { ItemCard } from "@/components/items/ItemCard";
import { getItemsByTypeSlug } from "@/lib/db/items";

export default async function ItemsByTypePage({
  params,
}: PageProps<"/items/[type]">) {
  const { type: slug } = await params;
  const result = await getItemsByTypeSlug(slug);

  if (!result) {
    notFound();
  }

  const { type, items } = result;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 font-heading text-3xl font-semibold">
          <ItemTypeIcon type={type} className="size-6" />
          {type.label}
        </h1>
        <p className="text-muted-foreground">
          {items.length} {items.length === 1 ? "item" : "items"}
        </p>
      </header>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No {type.label.toLowerCase()} yet.
        </p>
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
