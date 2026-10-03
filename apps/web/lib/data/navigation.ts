import type { NavItem } from "@ecommerce/contracts";

export const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "Shop",
    href: "/shop",
    active: true,
    children: [
      { label: "Shop Layouts", href: "#", isHeading: true },
      { label: "Full Width", href: "#" },
      { label: "Sidebar Left", href: "#" },
      { label: "Sidebar Right", href: "#" },
      { label: "List View", href: "#" },
      { label: "Shop Pages", href: "#", isHeading: true },
      { label: "Category", href: "/" },
    ],
  },
  { label: "Blog", href: "/blog" },
  { label: "About Us", href: "/about-us" },
  { label: "Contact Us", href: "/contact-us" },
  { label: "New Posts", href: "#" },
];

export const topBarLinks = [
  { label: "My Account", href: "/account" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "Cart", href: "/cart" },
  { label: "Checkout", href: "/checkout" },
  { label: "Sign In", href: "/login" },
] as const;
