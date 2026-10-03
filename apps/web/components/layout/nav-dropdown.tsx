"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { NavItem } from "@ecommerce/contracts";

export function NavDropdown({ items }: { items: NavItem[] }) {
  return (
    <motion.ul
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full left-0 z-600 bg-overlay min-w-50 list-none m-0 py-2 shadow-dropdown"
    >
      {items.map((child, idx) =>
        child.isHeading ? (
          <li
            key={`${child.label}-${idx}`}
            className="text-muted text-[11px] uppercase tracking-widest px-4 pt-2 pb-1 font-bold"
          >
            {child.label}
          </li>
        ) : (
          <li key={`${child.label}-${idx}`}>
            <Link
              href={child.href ?? "#"}
              className="block text-subtle text-[13px] px-4 py-2 no-underline hover:text-white transition-colors"
            >
              {child.label}
            </Link>
          </li>
        ),
      )}
    </motion.ul>
  );
}
