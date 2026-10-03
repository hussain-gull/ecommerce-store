"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, User } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { topBarLinks } from "@/lib/data/navigation";
import { useAuthStore } from "@/lib/store/auth.store";

export function MenuDropdown() {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((s) => s.user);

  const links = user
    ? topBarLinks.filter((l) => l.label !== "Sign In")
    : topBarLinks;

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        aria-label="Menu"
        className="flex items-center justify-center w-9 h-9 bg-transparent border-none cursor-pointer text-foreground hover:text-accent transition-colors"
      >
        <Menu size={16} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 z-600 bg-white border border-line min-w-40 list-none m-0 mt-1 py-1 shadow-dropdown"
          >
            {user && (
              <li className="flex items-center gap-2 px-4 py-2.5 border-b border-line">
                <User size={12} className="text-accent shrink-0" />
                <span className="text-xs font-semibold text-foreground truncate">
                  {user.firstName} {user.lastName}
                </span>
              </li>
            )}
            {links.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="block text-xs text-foreground px-4 py-2 no-underline hover:text-accent hover:bg-wash transition-colors whitespace-nowrap"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
