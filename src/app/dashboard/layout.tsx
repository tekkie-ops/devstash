import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <TooltipProvider>
      <SidebarProvider className="min-h-0 flex-1">
        <Sidebar />
        <SidebarInset className="min-h-0 overflow-hidden">
          <TopBar />
          <div className="flex-1 overflow-y-auto p-8">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
