import { Settings } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { currentUser } from "@/lib/mock-data";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Bottom user area. Display only — account and settings actions land in a
 * later phase.
 */
export function SidebarUser() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" tooltip={currentUser.name}>
          <Avatar size="sm">
            {currentUser.image ? (
              <AvatarImage src={currentUser.image} alt="" />
            ) : null}
            <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 leading-tight">
            <span className="truncate text-sm font-medium">
              {currentUser.name}
            </span>
            <span className="truncate text-xs text-sidebar-foreground/70">
              {currentUser.email}
            </span>
          </div>
        </SidebarMenuButton>
        <SidebarMenuAction aria-label="Settings">
          <Settings />
        </SidebarMenuAction>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
