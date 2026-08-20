import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";

/**
 * The search field and New Item button are still display only — the sidebar
 * trigger is the one live control.
 */
export function TopBar() {
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

      <Button className="ml-auto">
        <Plus />
        New Item
      </Button>
    </header>
  );
}
