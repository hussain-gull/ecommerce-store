import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { ChevronRightIcon, CirclePlusIcon, MailIcon } from "lucide-react";
import type { AdminRoute } from "@/lib/routes";

type NavSubItem = {
  title: string;
  route: AdminRoute;
  icon?: React.ReactNode;
};

type NavItem = {
  title: string;
  route?: AdminRoute;
  icon?: React.ReactNode;
  items?: NavSubItem[];
  badge?: React.ReactNode;
};

export function NavMain({
  items,
  activeRoute,
  onNavigate,
}: {
  items: NavItem[];
  activeRoute?: AdminRoute;
  onNavigate?: (route: AdminRoute) => void;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
            >
              <CirclePlusIcon />
              <span>Quick Create</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <MailIcon />
              <span className="sr-only">Inbox</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) =>
            item.items ? (
              <Collapsible
                key={item.title}
                defaultOpen={item.items.some(
                  (sub) => sub.route === activeRoute,
                )}
                render={<SidebarMenuItem className="group/collapsible" />}
              >
                <CollapsibleTrigger
                  render={
                    <SidebarMenuButton tooltip={item.title}>
                      {item.icon}
                      <span>{item.title}</span>
                      <ChevronRightIcon className="ml-auto transition-transform group-data-[open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  }
                />
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((sub) => (
                      <SidebarMenuSubItem key={sub.title}>
                        <SidebarMenuSubButton
                          render={<button type="button" />}
                          isActive={sub.route === activeRoute}
                          onClick={() => onNavigate?.(sub.route)}
                        >
                          {sub.icon}
                          <span>{sub.title}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={!!item.route && item.route === activeRoute}
                  disabled={!item.route}
                  onClick={
                    item.route ? () => onNavigate?.(item.route!) : undefined
                  }
                >
                  {item.icon}
                  <span>{item.title}</span>
                  {item.badge}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ),
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
