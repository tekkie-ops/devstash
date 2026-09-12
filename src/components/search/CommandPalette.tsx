"use client";

import { Folder } from "lucide-react";
import { useRouter } from "next/navigation";

import { ItemTypeIcon } from "@/components/dashboard/ItemTypeIcon";
import { useItemDrawer } from "@/components/items/ItemDrawerProvider";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import type { SearchableCollection } from "@/lib/db/collections";
import type { SearchableItem } from "@/lib/db/items";

/**
 * The Cmd/Ctrl+K palette's content: grouped Items/Collections results over
 * data pre-fetched once by the dashboard layout. cmdk does the fuzzy
 * filtering and keyboard navigation itself — this component only supplies
 * the data and what happens on select. Selecting an item opens it in the
 * (already-mounted) item drawer via context; selecting a collection
 * navigates to its page.
 */
export function CommandPalette({
  open,
  onOpenChange,
  items,
  collections,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: SearchableItem[];
  collections: SearchableCollection[];
}) {
  const router = useRouter();
  const { openItem } = useItemDrawer();

  function selectItem(id: string) {
    onOpenChange(false);
    openItem(id);
  }

  function selectCollection(id: string) {
    onOpenChange(false);
    router.push(`/collections/${id}`);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      description="Search across your items and collections"
    >
      <CommandInput placeholder="Search items and collections..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {items.length > 0 && (
          <CommandGroup heading="Items">
            {items.map((item) => (
              <CommandItem
                key={item.id}
                value={`${item.title} ${item.preview ?? ""} ${item.type.label}`}
                onSelect={() => selectItem(item.id)}
              >
                <ItemTypeIcon type={item.type} />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate">{item.title}</span>
                  {item.preview && (
                    <span className="truncate text-xs text-muted-foreground">
                      {item.preview}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {collections.length > 0 && (
          <CommandGroup heading="Collections">
            {collections.map((collection) => (
              <CommandItem
                key={collection.id}
                value={collection.name}
                onSelect={() => selectCollection(collection.id)}
              >
                <Folder className="text-muted-foreground" />
                <span className="flex-1 truncate">{collection.name}</span>
                <CommandShortcut>
                  {collection.itemCount}{" "}
                  {collection.itemCount === 1 ? "item" : "items"}
                </CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
