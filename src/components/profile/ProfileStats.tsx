import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ItemTypeIcon } from "@/components/dashboard/ItemTypeIcon";
import type { ProfileStats as ProfileStatsData } from "@/lib/db/profile";

export function ProfileStats({ stats }: { stats: ProfileStatsData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Items</span>
            <span className="font-heading text-2xl font-semibold">{stats.itemCount}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Collections</span>
            <span className="font-heading text-2xl font-semibold">{stats.collectionCount}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t pt-4">
          {stats.typeBreakdown.map((type) => (
            <div key={type.id} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <ItemTypeIcon type={type} />
                {type.label}
              </span>
              <span className="text-muted-foreground">{type.itemCount}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
