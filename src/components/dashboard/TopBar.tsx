import { Search } from "lucide-react";

import { CreateItemDialog } from "@/components/items/CreateItemDialog";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getCreatableItemTypes } from "@/lib/db/items";

/**
 * The search field is still display only. The sidebar trigger and the New Item
 * dialog are the live controls.
 */
export async function TopBar() {
  const itemTypes = await getCreatableItemTypes();

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4">
      <SidebarTrigger />

      <div className="relative w-full max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="Search items..."
          aria-label="Search items"
          className="pl-9 pr-14"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 select-none rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:block">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto">
        <CreateItemDialog types={itemTypes} />
      </div>
    </header>
  );
}
