"use client";

import { useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import type { Product } from "@ecommerce/contracts";
import {
  PAGE_SIZE,
  activeFilterCount,
  shopHref,
  type ShopFilters,
  type ShopSort,
} from "@/lib/shop/params";
import { ShopLink, useShopGo } from "@/components/shop/shop-view";
import { AnimatedCard } from "./animated-card";
import { ListCard } from "./list-card";
import { SortDropdown } from "./sort-dropdown";

type ProductGridProps = {
  products: Product[];
  total: number;
  page: number;
  pageCount: number;
  filters: ShopFilters;
};

export function ProductGrid({
  products,
  total,
  page,
  pageCount,
  filters,
}: ProductGridProps) {
  const go = useShopGo();
  const [view, setView] = useState<"grid" | "list">("grid");
  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between mb-5 pb-4 border-b border-line gap-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <p
            aria-live="polite"
            className="text-[13px] text-secondary m-0 shrink-0"
          >
            Showing {start}–{end} of {total} results
          </p>

          <div className="flex items-center gap-2 text-[13px]">
            <span className="font-medium text-foreground">Sort By</span>
            <SortDropdown
              value={filters.sort}
              onChange={(v) => go(shopHref(filters, { sort: v as ShopSort }))}
            />
          </div>
        </div>

        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={() => setView("grid")}
            aria-pressed={view === "grid"}
            aria-label="Grid view"
            className={`w-8 h-8 border flex items-center justify-center cursor-pointer transition-colors ${view === "grid" ? "border-accent bg-accent text-white" : "border-line bg-transparent text-secondary hover:border-accent hover:text-accent"}`}
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
            aria-label="List view"
            className={`w-8 h-8 border flex items-center justify-center cursor-pointer transition-colors ${view === "list" ? "border-accent bg-accent text-white" : "border-line bg-transparent text-secondary hover:border-accent hover:text-accent"}`}
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Products */}
      <div>
        {products.length === 0 && activeFilterCount(filters) === 0 ? (
          // Nothing to filter: the catalogue itself is empty.
          <div className="text-center py-16">
            <p className="text-sm text-secondary">
              No products are available right now — please check back soon.
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-secondary mb-5">
              No products match these filters.
            </p>
            <ShopLink
              href="/shop"
              className="inline-flex items-center h-11 px-8 bg-foreground text-white text-xs font-bold tracking-[2px] uppercase no-underline hover:bg-accent transition-colors"
            >
              Clear all filters
            </ShopLink>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            {products.map((p, i) => (
              <AnimatedCard key={p.id} product={p} index={i} />
            ))}
          </div>
        ) : (
          <div>
            {products.map((p) => (
              <ListCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <nav
          aria-label="Pagination"
          className="flex justify-center gap-1.5 mt-10"
        >
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <ShopLink
              key={n}
              href={shopHref(filters, { page: n })}
              push
              onClick={() => window.scrollTo({ top: 0 })}
              aria-current={page === n ? "page" : undefined}
              className={`w-9 h-9 border flex items-center justify-center text-[13px] font-semibold no-underline transition-colors ${page === n ? "border-accent bg-accent text-white" : "border-line bg-transparent text-foreground hover:border-accent hover:text-accent"}`}
            >
              {n}
            </ShopLink>
          ))}
        </nav>
      )}
    </div>
  );
}
