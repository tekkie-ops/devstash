"use client";

import type { ReactNode } from "react";

import { useItemDrawer } from "@/components/items/ItemDrawerProvider";

/**
 * Makes a server-rendered item card/row clickable without turning it into a
 * client component: it stays presentational, this wraps it in the trigger.
 */
export function ItemDrawerTrigger({
  itemId,
  children,
  className,
}: {
  itemId: string;
  children: ReactNode;
  className?: string;
}) {
  const { openItem } = useItemDrawer();

  return (
    <button
      type="button"
      onClick={() => openItem(itemId)}
      className={className}
      aria-haspopup="dialog"
    >
      {children}
    </button>
  );
}
