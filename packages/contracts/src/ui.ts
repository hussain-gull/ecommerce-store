export type NavItem = {
  label: string;
  href: string;
  active?: boolean;
  isHeading?: boolean;
  children?: NavItem[];
};
