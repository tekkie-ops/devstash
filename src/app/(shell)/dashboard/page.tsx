import { PinnedItems } from "@/components/dashboard/PinnedItems";
import { RecentCollections } from "@/components/dashboard/RecentCollections";
import { RecentItems } from "@/components/dashboard/RecentItems";
import { StatsCards } from "@/components/dashboard/StatsCards";

/**
 * The item drawer is provided by the dashboard layout (shared with the
 * command palette), not this page, so `PinnedItems`/`RecentItems` can open it
 * with no local wiring here.
 */
export default async function DashboardPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Your developer knowledge hub</p>
      </header>

      <StatsCards />
      <RecentCollections />
      <PinnedItems />
      <RecentItems />
    </div>
  );
}
