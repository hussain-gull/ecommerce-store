import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { NavMain } from "@/components/nav-main";
import { NavThemeSwitcher } from "@/components/nav-theme-switcher";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboardIcon,
  MessageSquareIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  HomeIcon,
  FilesIcon,
  InfoIcon,
  MailIcon,
  NewspaperIcon,
  PackageIcon,
  SlidersHorizontalIcon,
  BadgeCheckIcon,
} from "lucide-react";
import type { AdminRoute } from "@/lib/routes";
import { useAdminAuthStore } from "@/lib/store/admin-auth.store";
import { useUnreadMessageCount } from "@/lib/hooks/use-messages";
import { usePendingOrderCount } from "@/lib/hooks/use-orders";
import { branding } from "@ecommerce/contracts";

export function AppSidebar({
  activeRoute,
  onNavigate,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  activeRoute: AdminRoute;
  onNavigate: (route: AdminRoute) => void;
}) {
  const user = useAdminAuthStore((s) => s.user);
  const unreadCount = useUnreadMessageCount();
  const pendingOrders = usePendingOrderCount();

  const navMain = [
    {
      title: "Dashboard",
      route: "dashboard" as const,
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Pages Content",
      icon: <FilesIcon />,
      items: [
        {
          title: "Home Page",
          route: "content-home" as const,
          icon: <HomeIcon />,
        },
        {
          title: "About Us",
          route: "content-about" as const,
          icon: <InfoIcon />,
        },
        {
          title: "Contact Us",
          route: "content-contact" as const,
          icon: <MailIcon />,
        },
        {
          title: "Blog",
          route: "content-blog" as const,
          icon: <NewspaperIcon />,
        },
        {
          title: "Condition Guide",
          route: "content-condition-guide" as const,
          icon: <BadgeCheckIcon />,
        },
      ],
    },
    {
      title: "Products",
      route: "products" as const,
      icon: <PackageIcon />,
    },
    {
      title: "Orders",
      route: "orders" as const,
      icon: <ShoppingBagIcon />,
      ...(pendingOrders > 0 && {
        badge: (
          <Badge variant="destructive" className="ml-auto">
            {pendingOrders}
          </Badge>
        ),
      }),
    },
    {
      title: "Payment Details",
      route: "payment" as const,
      icon: <CreditCardIcon />,
    },
    {
      title: "Shop Filters",
      route: "filters" as const,
      icon: <SlidersHorizontalIcon />,
    },
    {
      title: "Messages",
      route: "messages" as const,
      icon: <MessageSquareIcon />,
      ...(unreadCount > 0 && {
        badge: (
          <Badge variant="destructive" className="ml-auto">
            {unreadCount}
          </Badge>
        ),
      }),
    },
  ];

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="#" />}
            >
              <img
                src={branding.logo}
                alt={branding.displayName}
                className="h-5 w-auto"
              />
              <span className="text-base font-semibold">
                {branding.displayName}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={navMain}
          activeRoute={activeRoute}
          onNavigate={onNavigate}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavThemeSwitcher />
        <NavUser
          user={{
            name: user?.name ?? "Admin",
            email: user?.email ?? "",
            avatar: "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
