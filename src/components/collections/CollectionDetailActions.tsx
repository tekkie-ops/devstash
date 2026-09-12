"use client";

import { useState } from "react";
import { Pencil, Star, Trash2 } from "lucide-react";

import { DeleteCollectionDialog } from "@/components/collections/DeleteCollectionDialog";
import { EditCollectionDialog } from "@/components/collections/EditCollectionDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CollectionSummary } from "@/lib/db/collections";

/**
 * Edit/Delete/Favorite buttons on the /collections/[id] detail page — the
 * direct-button counterpart to CollectionCard's dropdown menu. Favorite is
 * display-only for now, per this feature's spec. Deleting redirects back to
 * /collections since the detail page it's shown on no longer exists.
 */
export function CollectionDetailActions({
  collection,
}: {
  collection: CollectionSummary;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="flex items-center gap-1">
      <Button type="button" variant="ghost" size="sm">
        <Star
          className={cn(
            "size-4",
            collection.isFavorite && "fill-amber-400 text-amber-400",
          )}
        />
        Favorite
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setEditOpen(true)}
      >
        <Pencil className="size-4" />
        Edit
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2 className="size-4 text-destructive" />
        Delete
      </Button>

      <EditCollectionDialog
        collection={collection}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteCollectionDialog
        collection={collection}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        redirectTo="/collections"
      />
    </div>
  );
}
