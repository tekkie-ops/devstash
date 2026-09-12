"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { CollectionSummary } from "@/lib/db/collections";

/**
 * Shared toggle-favorite logic for collections — used by the detail page's
 * Favorite button, the card dropdown's menu item, and the card's own toggle
 * button, so the fetch/toast/refresh sequence lives in one place instead of
 * being copy-pasted at each call site.
 */
export function useToggleCollectionFavorite(
  onToggled?: (collection: CollectionSummary) => void,
) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function toggle(collectionId: string) {
    setPending(true);

    let result: {
      success: boolean;
      data?: CollectionSummary;
      error?: string;
    };
    try {
      const response = await fetch(
        `/api/collections/${collectionId}/favorite`,
        { method: "POST" },
      );
      result = await response.json();
    } catch {
      result = {
        success: false,
        error: "Something went wrong. Please try again.",
      };
    }

    setPending(false);

    if (!result.success || !result.data) {
      toast.error(result.error ?? "Couldn't update favorite");
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
