"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/**
 * Quick-copy control overlaid on an item card. Rendered as a sibling of the
 * card's drawer trigger, never inside it — a <button> can't nest in the
 * trigger's <button> — so clicking it doesn't open the drawer.
 */
export function CopyItemButton({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  function handleCopy() {
    void navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Copied to clipboard"))
      .catch(() => toast.error("Couldn't copy to clipboard"));
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="Copy"
      title="Copy"
      className={className}
      onClick={handleCopy}
    >
      <Copy className="size-4" />
    </Button>
  );
}
