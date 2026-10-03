import { memo, useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

const THEME_LABEL = {
  light: "Light",
  dark: "Dark",
  system: "System",
} as const;

// Sun/moon crossfade is pure CSS (transform + opacity), so switching themes
// never triggers a JS-driven re-paint loop — the browser compositor handles it.
function ThemeIcon() {
  return (
    <span className="relative flex size-4 shrink-0 items-center justify-center">
      <SunIcon className="absolute scale-100 rotate-0 transition-all duration-300 dark:scale-0 dark:-rotate-90" />
      <MoonIcon className="absolute scale-0 rotate-90 transition-all duration-300 dark:scale-100 dark:rotate-0" />
    </span>
  );
}

// Memoized: theme state lives in its own context (see ThemeProvider), so this
// leaf only re-renders when the theme itself changes — never on sidebar route
// or navigation state changes happening elsewhere in the tree.
export const NavThemeSwitcher = memo(function NavThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const onValueChange = useCallback(
    (value: string) => setTheme(value as "light" | "dark" | "system"),
    [setTheme],
  );

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton tooltip="Theme" />}>
            <ThemeIcon />
            <span>{THEME_LABEL[theme]}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="end"
            sideOffset={4}
            className="min-w-40"
          >
            <DropdownMenuRadioGroup value={theme} onValueChange={onValueChange}>
              <DropdownMenuRadioItem value="light">
                <SunIcon />
                Light
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <MoonIcon />
                Dark
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                <MonitorIcon />
                System
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
});
