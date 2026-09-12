"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Pencil, Pin, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteItem } from "@/actions/items";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { ItemDetail } from "@/lib/db/items";
import { cn } from "@/lib/utils";

/**
 * The favorite/pin/copy/edit/delete row. Favorite reflects the item's state
 * (amber when active); Favorite/Pin mutations land in a later feature — Copy,
 * Edit and Delete are wired up.
 */
export function ViewActionBar({
  detail,
  onEdit,
  onDeleted,
}: {
  detail: ItemDetail;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function handleCopy() {
    const text = detail.content ?? detail.url ?? "";
    if (!text) {
      toast.error("Nothing to copy");
      return;
    }
    void navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Copied to clipboard"))
      .catch(() => toast.error("Couldn't copy to clipboard"));
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteItem(detail.id);
    setDeleting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setConfirmOpen(false);
    onDeleted();
    toast.success("Item deleted");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1">
      <Button type="button" variant="ghost" size="sm">
        <Star
          className={cn(
            "size-4",
            detail.isFavorite && "fill-amber-400 text-amber-400",
          )}
        />
        Favorite
      </Button>
      <Button type="button" variant="ghost" size="sm">
        <Pin
          className={cn("size-4", detail.isPinned && "text-foreground")}
        />
        Pin
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={handleCopy}>
        <Copy className="size-4" />
        Copy
      </Button>

      <div className="ml-auto flex items-center gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="size-4" />
          Edit
        </Button>
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Delete"
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this item?</AlertDialogTitle>
              <AlertDialogDescription>
                &ldquo;{detail.title}&rdquo; will be permanently deleted. This
                cannot be undone.
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
      </div>
    </div>
  );
}
