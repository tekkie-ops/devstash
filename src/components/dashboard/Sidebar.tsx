import Link from "next/link";
import { Layers } from "lucide-react";

import {
  Sidebar as SidebarShell,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { SidebarUser } from "@/components/dashboard/SidebarUser";
import { SidebarTypesNav } from "@/components/dashboard/SidebarTypesNav";
import { SidebarCollectionsNav } from "@/components/dashboard/SidebarCollectionsNav";
import { auth } from "@/auth";
import {
  getFavoriteCollections,
  getRecentNonFavoriteCollections,
} from "@/lib/db/collections";
import { getItemTypesWithCounts } from "@/lib/db/items";

const RECENT_COLLECTION_LIMIT = 5;

/** Cap on the sidebar's Favorites group — it has no pagination to fall back on. */
const FAVORITE_COLLECTION_LIMIT = 12;

export async function Sidebar() {
  const session = await auth();
  const userId = session?.user?.id;

  const [itemTypes, favoriteCollections, recentCollections] = userId
    ? await Promise.all([
        getItemTypesWithCounts(),
        getFavoriteCollections(userId, FAVORITE_COLLECTION_LIMIT),
        getRecentNonFavoriteCollections(userId, RECENT_COLLECTION_LIMIT),
      ])
    : [await getItemTypesWithCounts(), [], []];

  return (
    <SidebarShell collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="DevStash">
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Layers />
                </div>
                <span className="text-base font-semibold">DevStash</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarTypesNav itemTypes={itemTypes} />

        <SidebarSeparator />

        <SidebarCollectionsNav
          favoriteCollections={favoriteCollections}
          recentCollections={recentCollections}
        />
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarUser />
      </SidebarFooter>

      <SidebarRail />
    </SidebarShell>
  );
}
