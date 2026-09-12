import Link from "next/link";
import { Star } from "lucide-react";

import { auth } from "@/auth";
import { CreateCollectionDialog } from "@/components/collections/CreateCollectionDialog";
import { CreateItemDialog } from "@/components/items/CreateItemDialog";
import { SearchTrigger } from "@/components/search/SearchTrigger";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getCollectionsForSelect } from "@/lib/db/collections";
import { getCreatableItemTypes } from "@/lib/db/items";

export async function TopBar() {
  const session = await auth();
  const userId = session?.user?.id;

  const [itemTypes, collections] = await Promise.all([
    getCreatableItemTypes(),
    userId ? getCollectionsForSelect(userId) : Promise.resolve([]),
  ]);

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4">
      <SidebarTrigger />

      <SearchTrigger />

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/favorites" aria-label="Favorites">
            <Star className="size-4" />
          </Link>
        </Button>
        <CreateCollectionDialog />
        <CreateItemDialog types={itemTypes} collections={collections} />
      </div>
    </header>
  );
}
