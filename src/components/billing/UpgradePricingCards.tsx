"use client";

import { useId, useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";

import { createCheckoutSession } from "@/actions/billing";
import { BRAND_GRADIENT, ITEM_TYPE_COLORS } from "@/components/homepage/item-colors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { FREE_FEATURES, PRO_FEATURES } from "@/lib/pricing-features";
import type { PlanInterval } from "@/lib/stripe";
import { cn } from "@/lib/utils";

export function UpgradePricingCards() {
  const [yearly, setYearly] = useState(false);
  const [loading, setLoading] = useState(false);
  const toggleId = useId();

  async function upgrade() {
    const interval: PlanInterval = yearly ? "yearly" : "monthly";
    setLoading(true);
    const result = await createCheckoutSession(interval);
    if (!result.success) {
      toast.error(result.error);
      setLoading(false);
      return;
    }
    window.location.href = result.url;
  }

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex items-center justify-center gap-3.5">
        <label
          htmlFor={toggleId}
          className={cn(
            "text-sm font-medium",
            !yearly ? "text-foreground" : "text-muted-foreground",
          )}
        >
          Monthly
        </label>
        <Switch id={toggleId} checked={yearly} onCheckedChange={setYearly} />
        <label
          htmlFor={toggleId}
          className={cn(
            "flex items-center gap-1.5 text-sm font-medium",
            yearly ? "text-foreground" : "text-muted-foreground",
          )}
        >
          Yearly
          <Badge variant="secondary" style={{ color: ITEM_TYPE_COLORS.link }}>
            Save 25%
          </Badge>
        </label>
      </div>

      <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2">
        <Card className="text-left">
          <CardHeader>
            <CardTitle className="text-xl">Free</CardTitle>
            <p className="mt-3">
              <span className="text-4xl font-extrabold">$0</span>
              <span className="text-sm text-muted-foreground">/mo</span>
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <ul className="flex flex-col gap-3">
              {FREE_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check
                    className="size-4 shrink-0"
                    style={{ color: ITEM_TYPE_COLORS.link }}
                  />
                  {feature}
                </li>
              ))}
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-4 shrink-0 text-center">–</span>
                No AI features
              </li>
            </ul>
            <Button variant="outline" className="w-full" disabled>
              Current plan
            </Button>
          </CardContent>
        </Card>

        <div className="relative">
          <Badge
            className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 text-white"
            style={{ background: BRAND_GRADIENT }}
          >
            Most Popular
          </Badge>
          <Card className="border-primary/40 text-left">
            <CardHeader>
              <CardTitle className="text-xl">Pro</CardTitle>
              <p className="mt-3">
                <span className="text-4xl font-extrabold">
                  {yearly ? "$72" : "$8"}
                </span>
                <span className="text-sm text-muted-foreground">
                  {yearly ? "/yr" : "/mo"}
                </span>
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <ul className="flex flex-col gap-3">
                {PRO_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check
                      className="size-4 shrink-0"
                      style={{ color: ITEM_TYPE_COLORS.link }}
                    />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button className="w-full" onClick={upgrade} disabled={loading}>
                {loading ? "Redirecting…" : `Upgrade — ${yearly ? "$72/yr" : "$8/mo"}`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
