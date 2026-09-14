import { ArrowRight } from "lucide-react";

import { ITEM_TYPE_COLORS } from "@/components/homepage/item-colors";

/** Pure CSS pulse (see .animate-arrow-pulse in globals.css) — no client JS needed. */
export function TransformArrow() {
  return (
    <div
      className="animate-arrow-pulse size-11 shrink-0"
      style={{ color: ITEM_TYPE_COLORS.prompt }}
      aria-hidden
    >
      <ArrowRight className="size-full" strokeWidth={2} />
    </div>
  );
}
