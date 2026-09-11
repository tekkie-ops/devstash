"use client";

import { Label } from "@/components/ui/label";

/**
 * Labeled form field wrapper shared by the item drawer's edit mode and the
 * New Item dialog. `htmlFor` is optional since some children (e.g. the Monaco
 * editor) have no input id to associate with.
 */
export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label
        htmlFor={htmlFor}
        className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
      >
        {label}
      </Label>
      {children}
    </div>
  );
}
