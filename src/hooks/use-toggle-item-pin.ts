"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { toggleItemPin } from "@/actions/items";
import type { ItemDetail } from "@/lib/db/items";

/**
 * Shared toggle-pin logic for the drawer's action bar. Takes the full detail
 * (not just an id) so it can optimistically flip `isPinned` for instant
 * feedback before the server responds, then reconcile with the real result —
 * reverting on failure. Mirrors useToggleItemFavorite otherwise.
 */
export function useToggleItemPin(onToggled?: (detail: ItemDetail) => void) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function toggle(detail: ItemDetail) {
    setPending(true);
    onToggled?.({ ...detail, isPinned: !detail.isPinned });

    const result = await toggleItemPin(detail.id);
    setPending(false);

    if (!result.success) {
      onToggled?.(detail);
      toast.error(result.error);
      return;
    }

    onToggled?.(result.data);
    toast.success(result.data.isPinned ? "Item pinned" : "Item unpinned");
    router.refresh();
  }

  return { pending, toggle };
}
