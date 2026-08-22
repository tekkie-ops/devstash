import Link from "next/link";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { ITEM_TYPE_ICONS } from "@/lib/icons";
import type { ItemTypeSummary } from "@/lib/db/items";

/** Pro-tier item types (see project-overview.md §3) — get a subtle "PRO" badge in the sidebar. */
const PRO_TYPE_NAMES = new Set(["file", "image"]);

/** Route for a type's item list, e.g. "Snippets" -> /items/snippets. */
function itemTypeHref(label: string) {
  return `/items/${label.toLowerCase()}`;
}

export function SidebarTypesNav({
  itemTypes,
}: {
  itemTypes: ItemTypeSummary[];
}) {
  return (
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
                    {PRO_TYPE_NAMES.has(type.name) && (
                      <Badge
                        variant="outline"
                        className="h-4 shrink-0 px-1.5 text-[10px] font-medium text-muted-foreground"
                      >
                        PRO
                      </Badge>
                    )}
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuBadge>{type.itemCount}</SidebarMenuBadge>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
