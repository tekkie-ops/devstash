import { auth } from "@/auth";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { ItemDrawerProvider } from "@/components/items/ItemDrawerProvider";
import { SearchProvider } from "@/components/search/SearchProvider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  getCollectionsForSelect,
  getSearchableCollections,
} from "@/lib/db/collections";
import { getSearchableItems } from "@/lib/db/items";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const session = await auth();
  const userId = session?.user?.id;

  const [availableCollections, searchableItems, searchableCollections] =
    userId
      ? await Promise.all([
          getCollectionsForSelect(userId),
          getSearchableItems(userId),
          getSearchableCollections(userId),
        ])
      : [[], [], []];

  return (
    <TooltipProvider>
      <SidebarProvider className="min-h-0 flex-1">
        <ItemDrawerProvider availableCollections={availableCollections}>
          <SearchProvider items={searchableItems} collections={searchableCollections}>
            <Sidebar />
            <SidebarInset className="min-h-0 overflow-hidden">
              <TopBar />
              <div className="flex-1 overflow-y-auto p-8">{children}</div>
            </SidebarInset>
          </SearchProvider>
        </ItemDrawerProvider>
      </SidebarProvider>
    </TooltipProvider>
  );
}
