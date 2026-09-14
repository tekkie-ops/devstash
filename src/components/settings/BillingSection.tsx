"use client";

import { useState } from "react";
import { toast } from "sonner";

import { createBillingPortalSession } from "@/actions/billing";
import { UpgradeButtons } from "@/components/billing/UpgradeButtons";
import { Button } from "@/components/ui/button";

export function BillingSection({ isPro }: { isPro: boolean }) {
  const [loading, setLoading] = useState<"portal" | null>(null);

  async function manage() {
    setLoading("portal");
    const result = await createBillingPortalSession();
    if (!result.success) {
      toast.error(result.error);
      setLoading(null);
      return;
    }
    window.location.href = result.url;
  }

  if (isPro) {
    return (
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          You&apos;re on the Pro plan. Manage your subscription, payment method, or
          invoices.
        </p>
        <Button onClick={manage} disabled={loading !== null}>
          {loading === "portal" ? "Opening…" : "Manage subscription"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        You&apos;re on the Free plan. Upgrade for unlimited items, collections,
        files, images, and AI features.
      </p>
      <UpgradeButtons />
    </div>
  );
}
