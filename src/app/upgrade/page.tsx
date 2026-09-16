import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { UpgradePricingCards } from "@/components/billing/UpgradePricingCards";

export default async function UpgradePage() {
  const session = await auth();

  if (session?.user?.isPro) {
    redirect("/settings");
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-6 py-16 text-center">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Upgrade to DevStash Pro</h1>
        <p className="mt-2 text-muted-foreground">
          Unlock files, images, unlimited items, and AI features.
        </p>
      </div>

      <UpgradePricingCards />

      <Link
        href="/dashboard"
        className="text-sm text-primary underline-offset-4 hover:underline"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
