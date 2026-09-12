"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { toggleItemFavorite } from "@/actions/items";
import type { ItemDetail } from "@/lib/db/items";

/**
 * Shared toggle-favorite logic for items — used by the drawer's action bar
 * and an item card's overlay button, so the action-call/toast/refresh
 * sequence lives in one place instead of being copy-pasted at each call site.
 */
export function useToggleItemFavorite(
  onToggled?: (detail: ItemDetail) => void,
) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function toggle(itemId: string) {
    setPending(true);
    const result = await toggleItemFavorite(itemId);
    setPending(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    onToggled?.(result.data);
    toast.success(
      result.data.isFavorite ? "Added to favorites" : "Removed from favorites",
    );
    router.refresh();
  }

  return { pending, toggle };
}
