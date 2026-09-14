"use client";

import { useState } from "react";
import { toast } from "sonner";

import { createBillingPortalSession, createCheckoutSession } from "@/actions/billing";
import { Button } from "@/components/ui/button";
import type { PlanInterval } from "@/lib/stripe";

export function BillingSection({ isPro }: { isPro: boolean }) {
  const [loading, setLoading] = useState<PlanInterval | "portal" | null>(null);

  async function upgrade(interval: PlanInterval) {
    setLoading(interval);
    const result = await createCheckoutSession(interval);
    if (!result.success) {
      toast.error(result.error);
      setLoading(null);
      return;
    }
    window.location.href = result.url;
  }

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
      <div className="flex gap-2">
        <Button onClick={() => upgrade("monthly")} disabled={loading !== null}>
          {loading === "monthly" ? "Redirecting…" : "Upgrade — $8/mo"}
        </Button>
        <Button
          variant="outline"
          onClick={() => upgrade("yearly")}
          disabled={loading !== null}
        >
          {loading === "yearly" ? "Redirecting…" : "Upgrade — $72/yr"}
        </Button>
      </div>
    </div>
  );
}
