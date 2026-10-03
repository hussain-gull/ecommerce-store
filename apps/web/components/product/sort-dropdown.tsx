"use client";

import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { SORT_OPTIONS } from "@/lib/shop/params";

interface SortDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const [open, setOpen] = useState(false);
  const selected =
    SORT_OPTIONS.find((o) => o.value === value) ?? SORT_OPTIONS[0]!;

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 border border-line text-[13px] text-foreground bg-white px-3 py-1.5 cursor-pointer outline-none hover:border-accent transition-colors min-w-40"
      >
        <span className="flex-1 text-left">{selected.label}</span>
        <ChevronDown
          size={12}
          className={`text-secondary transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 z-600 bg-white border border-line min-w-full list-none m-0 mt-0.5 py-1 shadow-dropdown"
          >
            {SORT_OPTIONS.map((option) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex items-center justify-between px-3 py-2 text-[13px] cursor-pointer transition-colors ${
                  option.value === value
                    ? "text-accent bg-wash"
                    : "text-foreground hover:text-accent hover:bg-wash"
                }`}
              >
                {option.label}
                {option.value === value && (
                  <Check size={12} className="text-accent" />
                )}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
