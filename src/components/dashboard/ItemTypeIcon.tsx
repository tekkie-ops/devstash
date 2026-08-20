import { ITEM_TYPE_ICONS } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { ItemType } from "@/lib/mock-data";

/**
 * Type colors arrive from the data as hex, so they are applied inline —
 * a hardcoded hex-to-class table would stop tracking the source of truth.
 */
export function ItemTypeIcon({
  type,
  className,
}: {
  type: ItemType;
  className?: string;
}) {
  const Icon = ITEM_TYPE_ICONS[type.icon];

  if (!Icon) {
    return null;
  }

  return (
    <Icon
      aria-label={type.label}
      className={cn("size-4 shrink-0", className)}
      style={{ color: type.color }}
    />
  );
}

/** The icon on its own tinted tile, used at the start of an item row. */
export function ItemTypeTile({ type }: { type: ItemType }) {
  return (
    <div
      className="flex size-9 shrink-0 items-center justify-center rounded-lg"
      style={{ backgroundColor: `${type.color}1a` }}
    >
      <ItemTypeIcon type={type} />
    </div>
  );
}
