import { Clock } from "lucide-react";

import { ItemRow } from "@/components/dashboard/ItemRow";
import { getRecentItems } from "@/lib/db/items";

const RECENT_ITEM_LIMIT = 10;

export async function RecentItems() {
  const recentItems = await getRecentItems(RECENT_ITEM_LIMIT);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Clock aria-hidden="true" className="size-4" />
        Recent
      </h2>

      <div className="flex flex-col gap-3">
        {recentItems.map((item) => (
          <ItemRow key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
