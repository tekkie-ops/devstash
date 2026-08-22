import Link from "next/link";
import { Folder, Star } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { CollectionSummary } from "@/lib/db/collections";

function CollectionMenuItem({
  collection,
  children,
}: {
  collection: CollectionSummary;
  children: React.ReactNode;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={collection.name}>
        <Link href={`/collections/${collection.id}`}>
          <Folder />
          <span>{collection.name}</span>
        </Link>
      </SidebarMenuButton>
      <SidebarMenuBadge>{children}</SidebarMenuBadge>
    </SidebarMenuItem>
  );
}

export function SidebarCollectionsNav({
  favoriteCollections,
  recentCollections,
}: {
  favoriteCollections: CollectionSummary[];
  recentCollections: CollectionSummary[];
}) {
  return (
    <>
      {favoriteCollections.length > 0 && (
        <SidebarGroup>
          <SidebarGroupLabel>Favorites</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {favoriteCollections.map((collection) => (
                <CollectionMenuItem key={collection.id} collection={collection}>
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                </CollectionMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      <SidebarGroup>
        <SidebarGroupLabel>Recent Collections</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {recentCollections.map((collection) => (
              <CollectionMenuItem key={collection.id} collection={collection}>
                <span
                  aria-hidden="true"
                  className="block size-2.5 rounded-full"
                  style={{
                    backgroundColor:
                      collection.types[0]?.color ?? "var(--sidebar-border)",
                  }}
                />
              </CollectionMenuItem>
            ))}
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="View all collections">
                <Link href="/collections" className="text-sidebar-foreground/70">
                  <span>View all collections</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
