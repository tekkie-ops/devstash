"use client";

import { useState } from "react";
import { MoreVertical, Pencil, Star, Trash2 } from "lucide-react";

import { DeleteCollectionDialog } from "@/components/collections/DeleteCollectionDialog";
import { EditCollectionDialog } from "@/components/collections/EditCollectionDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CollectionSummary } from "@/lib/db/collections";

/**
 * The 3-dot menu on CollectionCard (used on /collections and the dashboard).
 * The card itself is a Link to /collections/[id]; this menu is an absolutely
 * positioned sibling (not nested inside the Link) so it intercepts its own
 * clicks without needing stopPropagation — same pattern as ItemCard's
 * CopyItemButton. Favorite is display-only for now, per this feature's spec.
 */
export function CollectionActionsMenu({
  collection,
}: {
  collection: CollectionSummary;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Collection actions"
            className="bg-card/80 text-muted-foreground hover:text-foreground"
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setDeleteOpen(true)}
          >
            <Trash2 />
            Delete
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <Star
              className={
                collection.isFavorite ? "fill-amber-400 text-amber-400" : undefined
              }
            />
            {collection.isFavorite ? "Unfavorite" : "Favorite"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditCollectionDialog
        collection={collection}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteCollectionDialog
        collection={collection}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
