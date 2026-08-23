import Link from "next/link";
import { Settings } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { UserAvatar } from "@/components/auth/UserAvatar";
import { signOutAction } from "@/actions/auth";
import { auth } from "@/auth";

/**
 * Bottom user area. The settings gear links to the profile page; the
 * avatar/name button opens a dropdown with sign out.
 */
export async function SidebarUser() {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    return null;
  }

  const name = user.name ?? user.email ?? "Account";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" tooltip={name}>
              <UserAvatar name={name} image={user.image} size="sm" />
              <div className="grid flex-1 leading-tight">
                <span className="truncate text-sm font-medium">{name}</span>
                <span className="truncate text-xs text-sidebar-foreground/70">
                  {user.email}
                </span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top">
            <DropdownMenuItem asChild variant="destructive">
              <form action={signOutAction} className="contents">
                <button type="submit" className="w-full text-left">
                  Sign out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <SidebarMenuAction asChild aria-label="Profile">
          <Link href="/profile">
            <Settings />
          </Link>
        </SidebarMenuAction>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
