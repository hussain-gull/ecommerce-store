"use client";

import { X } from "lucide-react";
import { CURRENCY_PREFIX } from "@ecommerce/contracts";
import {
  FACET_KEYS,
  activeFilterCount,
  shopHref,
  type ShopFilters,
} from "@/lib/shop/params";
import { ShopLink } from "./shop-view";

type Chip = { label: string; href: string };

export function ActiveFilters({ filters }: { filters: ShopFilters }) {
  if (activeFilterCount(filters) === 0) return null;

  const chips: Chip[] = [];
  if (filters.q) {
    chips.push({ label: `“${filters.q}”`, href: shopHref(filters, { q: "" }) });
  }
  for (const key of FACET_KEYS) {
    for (const value of filters[key]) {
      chips.push({
        label: key === "size" ? `UK ${value}` : value,
        href: shopHref(filters, {
          [key]: filters[key].filter((v) => v !== value),
        }),
      });
    }
  }
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    chips.push({
      label: `${CURRENCY_PREFIX}${filters.minPrice ?? 0}–${CURRENCY_PREFIX}${filters.maxPrice ?? "∞"}`,
      href: shopHref(filters, { minPrice: undefined, maxPrice: undefined }),
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-5">
      {chips.map((chip) => (
        <ShopLink
          key={chip.href}
          href={chip.href}
          aria-label={`Remove filter ${chip.label}`}
          className="inline-flex items-center gap-1.5 h-8 px-3 bg-wash border border-line text-[12px] text-foreground no-underline hover:border-accent hover:text-accent transition-colors"
        >
          {chip.label}
          <X size={12} />
        </ShopLink>
      ))}
      <ShopLink
        href="/shop"
        className="text-xs font-bold uppercase tracking-widest text-foreground no-underline border-b border-foreground pb-0.5 ml-1 hover:text-accent hover:border-accent transition-colors"
      >
        Clear all
      </ShopLink>
    </div>
  );
}
