import { Files, FolderHeart, Folders, Star, type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { getCollectionStats } from "@/lib/db/collections";
import { getItemStats } from "@/lib/db/items";

interface Stat {
  label: string;
  value: number;
  icon: LucideIcon;
}

function StatCard({ label, value, icon: Icon }: Stat) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="font-heading text-2xl font-semibold">{value}</span>
        </div>
        <Icon aria-hidden="true" className="size-5 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

export async function StatsCards() {
  const [collectionStats, itemStats] = await Promise.all([
    getCollectionStats(),
    getItemStats(),
  ]);

  const stats: Stat[] = [
    { label: "Items", value: itemStats.total, icon: Files },
    { label: "Collections", value: collectionStats.total, icon: Folders },
    {
      label: "Favorite Items",
      value: itemStats.favorites,
      icon: Star,
    },
    {
      label: "Favorite Collections",
      value: collectionStats.favorites,
      icon: FolderHeart,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}
