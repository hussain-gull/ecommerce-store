"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { topBarLinks } from "@/lib/data/navigation";

export function SelectDropdown() {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button className="flex items-center gap-1 text-secondary bg-transparent border-none cursor-pointer p-0 text-xs uppercase tracking-wider hover:text-foreground transition-colors">
        Select an option
        <ChevronDown
          size={11}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 z-600 bg-white border border-line min-w-40 list-none m-0 mt-1 py-1 shadow-dropdown"
          >
            {topBarLinks.map((link) => (
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
