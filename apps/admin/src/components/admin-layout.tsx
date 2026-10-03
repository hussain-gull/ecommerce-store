import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { AdminRoute } from "@/lib/routes";

export function AdminLayout({
  title,
  activeRoute,
  onNavigate,
  children,
}: {
  title?: string;
  activeRoute: AdminRoute;
  onNavigate: (route: AdminRoute) => void;
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        variant="inset"
        activeRoute={activeRoute}
        onNavigate={onNavigate}
      />
      <SidebarInset>
        <SiteHeader title={title} />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
