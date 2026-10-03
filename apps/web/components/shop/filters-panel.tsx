"use client";

import React, { useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

type FiltersPanelProps = {
  activeCount: number;
  total: number;
  children: React.ReactNode;
};

// One sidebar render for every breakpoint: a static column on desktop, a
// full-screen panel on mobile. `children` stays a Server Component tree.
export function FiltersPanel({
  activeCount,
  total,
  children,
}: FiltersPanelProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="shop-filters"
        className="lg:hidden flex items-center gap-2 h-11 px-5 mb-5 border border-foreground bg-transparent text-xs font-bold uppercase tracking-widest cursor-pointer"
      >
        <SlidersHorizontal size={14} />
        Filters{activeCount > 0 && ` (${activeCount})`}
      </button>

      <aside
        id="shop-filters"
        aria-label="Product filters"
        className={`${
          open ? "fixed inset-0 z-9998 flex flex-col bg-wash" : "hidden"
        } lg:flex lg:flex-col lg:z-auto w-full lg:w-56 shrink-0 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)]`}
      >
        <div className="lg:hidden flex items-center justify-between px-5 h-16 border-b border-line">
          <span className="text-base font-bold uppercase text-foreground">
            Filters
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close filters"
            className="bg-transparent border-none cursor-pointer p-2 text-foreground"
          >
            <X size={22} />
          </button>
        </div>

        {/* min-h-0: flex children won't shrink below content height without it, so the list would never scroll */}
        <div
          // Open mobile panel is a modal: keep the wheel inside it, never the page behind.
          data-lenis-prevent={open || undefined}
          className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-5 py-5 lg:p-0 scrollbar-none [&::-webkit-scrollbar]:hidden ${
            open ? "overscroll-contain" : ""
          }`}
        >
          {children}
        </div>

        <div className="lg:hidden p-4 border-t border-line">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full h-12 bg-foreground text-wash text-xs font-bold uppercase tracking-[2px] border-none cursor-pointer hover:bg-accent transition-colors"
          >
            Show {total} {total === 1 ? "result" : "results"}
          </button>
        </div>
      </aside>
    </>
  );
}
