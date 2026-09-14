import { Lock } from "lucide-react";

import { ItemTypeTile } from "@/components/dashboard/ItemTypeIcon";
import type { IconableType } from "@/components/dashboard/ItemTypeIcon";
import { UpgradeButtons } from "@/components/billing/UpgradeButtons";
import { proTypeMessage } from "@/lib/plan-limits";

export function ProUpgradePage({ type }: { type: IconableType }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border bg-card px-6 py-16 text-center">
      <div className="relative">
        <ItemTypeTile type={type} />
        <Lock className="absolute -right-1 -bottom-1 size-4 rounded-full bg-background p-0.5 text-muted-foreground" />
      </div>
      <h2 className="font-heading text-xl font-semibold">
        {type.label} are a Pro feature
      </h2>
      <p className="max-w-sm text-sm text-muted-foreground">{proTypeMessage()}</p>
      <UpgradeButtons />
    </div>
  );
}
