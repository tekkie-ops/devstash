"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { CollectionSummary } from "@/lib/db/collections";

/**
 * Fully-controlled delete confirmation (no AlertDialogTrigger) — opened from
 * either the card dropdown (CollectionActionsMenu) or the /collections/[id]
 * detail page's Delete button. DELETEs /api/collections/[id]; the schema
 * only cascades the ItemCollection membership rows, so the collection's
 * items are never deleted, just detached from it.
 */
export function DeleteCollectionDialog({
  collection,
  open,
  onOpenChange,
  redirectTo,
}: {
  collection: CollectionSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Where to navigate after a successful delete — omit to refresh in place (card views). */
  redirectTo?: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  function handleOpenChange(next: boolean) {
    if (deleting) return;
    onOpenChange(next);
  }

  async function handleDelete() {
    setDeleting(true);

    let result: { success: boolean; error?: string };
    try {
      const response = await fetch(`/api/collections/${collection.id}`, {
        method: "DELETE",
      });
      result = await response.json();
    } catch {
      result = {
        success: false,
        error: "Something went wrong. Please try again.",
      };
    }

    setDeleting(false);

    if (!result.success) {
      toast.error(result.error ?? "Couldn't delete collection");
      return;
    }

    onOpenChange(false);
    toast.success("Collection deleted");

    if (redirectTo) {
      router.push(redirectTo);
    } else {
      router.refresh();
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this collection?</AlertDialogTitle>
          <AlertDialogDescription>
            &ldquo;{collection.name}&rdquo; will be deleted. Its items will
            not be deleted — they will just no longer belong to this
            collection. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleting}
            onClick={(event) => {
              event.preventDefault();
              void handleDelete();
            }}
          >
            {deleting ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
