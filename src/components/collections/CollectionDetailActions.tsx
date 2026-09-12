"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { CollectionFavoriteButton } from "@/components/collections/CollectionFavoriteButton";
import { DeleteCollectionDialog } from "@/components/collections/DeleteCollectionDialog";
import { EditCollectionDialog } from "@/components/collections/EditCollectionDialog";
import { Button } from "@/components/ui/button";
import type { CollectionSummary } from "@/lib/db/collections";

/**
 * Edit/Delete/Favorite buttons on the /collections/[id] detail page — the
 * direct-button counterpart to CollectionCard's dropdown menu. Deleting
 * redirects back to /collections since the detail page it's shown on no
 * longer exists.
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
      <CollectionFavoriteButton collection={collection} showLabel />
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
