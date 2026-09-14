"use client";

import { useState } from "react";
import { toast } from "sonner";

import { createCheckoutSession } from "@/actions/billing";
import { Button } from "@/components/ui/button";
import type { PlanInterval } from "@/lib/stripe";

export function UpgradeButtons() {
  const [loading, setLoading] = useState<PlanInterval | null>(null);

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

  return (
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
  );
}
