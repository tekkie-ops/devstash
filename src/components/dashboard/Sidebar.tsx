import Link from "next/link";
import { Folder, Layers, Star } from "lucide-react";

import {
  Sidebar as SidebarShell,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { SidebarUser } from "@/components/dashboard/SidebarUser";
import { ITEM_TYPE_ICONS } from "@/lib/icons";
import { collections, items, itemTypes, type Collection } from "@/lib/mock-data";

const RECENT_COLLECTION_LIMIT = 5;

function countItemsOfType(typeId: string) {
  return items.filter((item) => item.typeId === typeId).length;
}

function countItemsInCollection(collectionId: string) {
  return items.filter((item) => item.collectionIds.includes(collectionId))
    .length;
}

/** Route for a type's item list, e.g. "Snippets" -> /items/snippets. */
function itemTypeHref(label: string) {
  return `/items/${label.toLowerCase()}`;
}

function CollectionMenuItem({
  collection,
  children,
}: {
  collection: Collection;
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

export function Sidebar() {
  const favoriteCollections = collections.filter(
    (collection) => collection.isFavorite,
  );
  const recentCollections = collections
    .filter((collection) => !collection.isFavorite)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, RECENT_COLLECTION_LIMIT);

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
        <SidebarGroup>
          <SidebarGroupLabel>Types</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {itemTypes.map((type) => {
                const Icon = ITEM_TYPE_ICONS[type.icon];

                return (
                  <SidebarMenuItem key={type.id}>
                    <SidebarMenuButton asChild tooltip={type.label}>
                      <Link href={itemTypeHref(type.label)}>
                        {Icon ? <Icon style={{ color: type.color }} /> : null}
                        <span>{type.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    <SidebarMenuBadge>
                      {countItemsOfType(type.id)}
                    </SidebarMenuBadge>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {favoriteCollections.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Favorites</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {favoriteCollections.map((collection) => (
                  <CollectionMenuItem
                    key={collection.id}
                    collection={collection}
                  >
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
                  {countItemsInCollection(collection.id)}
                </CollectionMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarUser />
      </SidebarFooter>

      <SidebarRail />
    </SidebarShell>
  );
}
