import { Pin } from "lucide-react";

import { ItemRow } from "@/components/dashboard/ItemRow";
import { byNewest } from "@/lib/dashboard";
import { items } from "@/lib/mock-data";

export function PinnedItems() {
  const pinnedItems = items.filter((item) => item.isPinned).sort(byNewest);

  if (pinnedItems.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Pin aria-hidden="true" className="size-4" />
        Pinned
      </h2>

      <div className="flex flex-col gap-3">
        {pinnedItems.map((item) => (
          <ItemRow key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
