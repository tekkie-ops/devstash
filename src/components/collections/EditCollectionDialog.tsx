"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Field } from "@/components/items/ItemFormField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CollectionSummary } from "@/lib/db/collections";

/**
 * Fully-controlled edit modal (no DialogTrigger) — opened from either the
 * card dropdown (CollectionActionsMenu) or the /collections/[id] detail
 * page's Edit button. PATCHes /api/collections/[id], mirroring
 * CreateCollectionDialog's fetch pattern.
 */
export function EditCollectionDialog({
  collection,
  open,
  onOpenChange,
}: {
  collection: CollectionSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description ?? "");

  // Re-seed the fields from the collection each time the dialog opens, so a
  // cancelled edit doesn't leave stale values for the next open. Adjusting
  // state during render (React's documented alternative to an effect here)
  // rather than syncing in a useEffect, which would cascade an extra render.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName(collection.name);
      setDescription(collection.description ?? "");
    }
  }

  function handleOpenChange(next: boolean) {
    if (submitting) return;
    onOpenChange(next);
  }

  const canSubmit = name.trim().length > 0 && !submitting;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);

    let result: { success: boolean; error?: string };
    try {
      const response = await fetch(`/api/collections/${collection.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      result = await response.json();
    } catch {
      result = {
        success: false,
        error: "Something went wrong. Please try again.",
      };
    }

    setSubmitting(false);

    if (!result.success) {
      toast.error(result.error ?? "Couldn't update collection");
      return;
    }

    toast.success("Collection updated");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <DialogHeader className="border-b p-6 pr-14">
          <DialogTitle>Edit collection</DialogTitle>
          <DialogDescription>
            Update the collection&rsquo;s name and description.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="flex flex-col gap-6 p-6">
            <Field label="Name" htmlFor={`edit-collection-name-${collection.id}`}>
              <Input
                id={`edit-collection-name-${collection.id}`}
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                autoFocus
              />
            </Field>

            <Field
              label="Description"
              htmlFor={`edit-collection-description-${collection.id}`}
            >
              <Textarea
                id={`edit-collection-description-${collection.id}`}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
              />
            </Field>
          </div>

          <div className="flex items-center justify-end gap-2 border-t p-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {submitting ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
