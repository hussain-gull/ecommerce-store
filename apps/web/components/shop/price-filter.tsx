"use client";

import { CURRENCY_PREFIX } from "@ecommerce/contracts";
import { useEffect, useRef, useState } from "react";
import { useShopGo } from "./shop-view";
import { shopHref, type ShopFilters } from "@/lib/shop/params";

const DEBOUNCE_MS = 300;

type PriceFilterProps = {
  filters: ShopFilters;
  bounds: { min: number; max: number };
};

export function PriceFilter({ filters, bounds }: PriceFilterProps) {
  const go = useShopGo();
  const [lo, setLo] = useState(filters.minPrice ?? bounds.min);
  const [hi, setHi] = useState(filters.maxPrice ?? bounds.max);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Resync when the URL changes elsewhere (chip removed, "Clear all").
  useEffect(() => {
    setLo(filters.minPrice ?? bounds.min);
    setHi(filters.maxPrice ?? bounds.max);
  }, [filters.minPrice, filters.maxPrice, bounds.min, bounds.max]);

  useEffect(() => () => clearTimeout(timer.current), []);

  function commit(nextLo: number, nextHi: number) {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const isFullRange = nextLo <= bounds.min && nextHi >= bounds.max;
      const href = shopHref(filters, {
        minPrice: isFullRange ? undefined : nextLo,
        maxPrice: isFullRange ? undefined : nextHi,
      });
      go(href);
    }, DEBOUNCE_MS);
  }

  return (
    <div>
      <p className="text-[13px] text-secondary mb-3">
        {CURRENCY_PREFIX}
        {lo} — {CURRENCY_PREFIX}
        {hi}
      </p>
      <label className="block text-[11px] uppercase tracking-widest text-subtle">
        Min
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          value={lo}
          onChange={(e) => {
            const v = Math.min(Number(e.target.value), hi);
            setLo(v);
            commit(v, hi);
          }}
          className="w-full h-1.25 accent-accent cursor-pointer"
          aria-valuetext={`${CURRENCY_PREFIX}${lo}`}
        />
      </label>
      <label className="block text-[11px] uppercase tracking-widest text-subtle mt-2">
        Max
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          value={hi}
          onChange={(e) => {
            const v = Math.max(Number(e.target.value), lo);
            setHi(v);
            commit(lo, v);
          }}
          className="w-full h-1.25 accent-accent cursor-pointer"
          aria-valuetext={`${CURRENCY_PREFIX}${hi}`}
        />
      </label>
    </div>
  );
}
