"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ShopQueryResult } from "@ecommerce/contracts";
import { queryShopApi } from "@/lib/api/product.api";
import { toShopResult } from "@/lib/shop/query";
import {
  activeFilterCount,
  parseShopParams,
  type ShopFilters,
} from "@/lib/shop/params";
import { ProductGrid } from "@/components/product/product-grid";
import { FiltersPanel } from "./filters-panel";
import { ShopSidebar } from "./shop-sidebar";
import { ActiveFilters } from "./active-filters";
import Link from "next/link";

type Go = (href: string, opts?: { push?: boolean }) => void;
const GoContext = createContext<Go>((href) => window.location.assign(href));
export const useShopGo = () => useContext(GoContext);

const fromUrl = (href: string) =>
  parseShopParams(
    Object.fromEntries(new URL(href, window.location.origin).searchParams),
  );

type ShopViewProps = {
  initialResult: ShopQueryResult;
  initialFilters: ShopFilters;
};

// First paint is server-rendered (SEO). After hydration every filter change is
// one `QUERY /api/v1/products` call (the API filters in Postgres) plus a URL
// rewrite. `filters` updates instantly so hrefs/chips stay current; the result
// swaps in when it arrives, and an older in-flight request is aborted so a slow
// response can never overwrite a newer one.
export function ShopView({ initialResult, initialFilters }: ShopViewProps) {
  const [filters, setFilters] = useState(initialFilters);
  const [raw, setRaw] = useState(initialResult);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const inflight = useRef<AbortController | null>(null);

  const result = useMemo(() => toShopResult(raw, filters), [raw, filters]);

  function load(next: ShopFilters) {
    inflight.current?.abort();
    const ctl = new AbortController();
    inflight.current = ctl;
    setLoading(true);
    setFailed(false);
    queryShopApi(next, ctl.signal)
      .then((r) => {
        if (ctl.signal.aborted) return;
        setRaw(r);
        setLoading(false);
      })
      .catch(() => {
        if (ctl.signal.aborted) return;
        setFailed(true);
        setLoading(false);
      });
  }

  // Native history calls sync with Next's router (docs: "Using the native History API").
  const go: Go = (href, { push } = {}) => {
    const next = fromUrl(href);
    setFilters(next);
    window.history[push ? "pushState" : "replaceState"](null, "", href);
    load(next);
  };

  useEffect(() => {
    const onPop = () => {
      const next = fromUrl(window.location.href);
      setFilters(next);
      load(next);
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      inflight.current?.abort();
    };
  }, []);

  return (
    <GoContext value={go}>
      <FiltersPanel
        activeCount={activeFilterCount(filters)}
        total={result.total}
      >
        <ShopSidebar filters={filters} result={result} />
      </FiltersPanel>
      <main
        aria-busy={loading}
        className={`flex-1 min-w-0 transition-opacity ${loading ? "opacity-60" : ""}`}
      >
        {failed && (
          <p role="alert" className="mb-4 text-[13px] text-accent">
            Couldn&apos;t update the results.{" "}
            <button
              type="button"
              onClick={() => load(filters)}
              className="underline bg-transparent border-none cursor-pointer text-accent p-0"
            >
              Try again
            </button>
          </p>
        )}
        <ActiveFilters filters={filters} />
        <ProductGrid
          products={result.items}
          total={result.total}
          page={result.page}
          pageCount={result.pageCount}
          filters={filters}
        />
      </main>
    </GoContext>
  );
}

// Real <a href>: crawlable and works before hydration; intercepted after.
export function ShopLink({
  href,
  push,
  onClick,
  ...rest
}: React.ComponentProps<"a"> & { href: string; push?: boolean }) {
  const go = useShopGo();
  return (
    <Link
      href={href}
      onClick={(e) => {
        onClick?.(e);
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        go(href, { push });
      }}
      {...rest}
    />
  );
}
