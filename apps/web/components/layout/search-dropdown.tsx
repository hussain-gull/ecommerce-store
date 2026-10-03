"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  SUGGEST_MIN_CHARS,
  type ProductSuggestion,
} from "@ecommerce/contracts";
import { suggestProductsApi } from "@/lib/api/product.api";

const DEBOUNCE_MS = 250;

export function SearchDropdown() {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  // null = nothing fetched yet for the current query (or still loading).
  const [results, setResults] = useState<ProductSuggestion[] | null>(null);
  const [active, setActive] = useState(-1);

  const q = query.trim();
  const ready = q.length >= SUGGEST_MIN_CHARS;

  useEffect(() => {
    if (!ready) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      suggestProductsApi(q, ctrl.signal)
        .then((r) => {
          setResults(r);
          setActive(-1);
        })
        .catch(() => {});
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, ready]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    setQuery("");
    setResults(null);
  };

  const shown = ready ? results : null;
  // One extra row after the products: "See all results".
  const rowCount = shown ? shown.length + 1 : 0;
  const allHref = `/shop?q=${encodeURIComponent(q)}`;

  const go = (href: string) => {
    close();
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return setOpen(false);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!rowCount) return;
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      // -1 = focus stays in the input; cycles input → rows → input.
      setActive((a) => ((a + 1 + step + rowCount + 1) % (rowCount + 1)) - 1);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    const hit = shown?.[active];
    go(hit ? `/products/${hit.slug}` : allHref);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        aria-label="Search"
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className={`flex items-center justify-center w-9 h-9 bg-transparent border-none cursor-pointer transition-colors ${open ? "text-accent" : "text-foreground hover:text-accent"}`}
      >
        <Search size={16} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 z-600 bg-white shadow-dropdown mt-1 w-80 max-w-[calc(100vw-2rem)]"
          >
            <form
              role="search"
              onSubmit={onSubmit}
              className="flex items-center gap-3 px-4 py-3"
            >
              <input
                ref={inputRef}
                type="search"
                role="combobox"
                aria-expanded={!!shown}
                aria-controls={listId}
                aria-activedescendant={
                  active >= 0 ? `${listId}-${active}` : undefined
                }
                aria-autocomplete="list"
                autoComplete="off"
                maxLength={100}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search product..."
                className="flex-1 min-w-0 text-sm placeholder-muted bg-transparent border-none outline-none [&::-webkit-search-cancel-button]:appearance-none"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setQuery("");
                    setResults(null);
                    inputRef.current?.focus();
                  }}
                  className="bg-transparent border-none cursor-pointer p-0 text-secondary hover:text-accent transition-colors"
                >
                  <X size={15} />
                </button>
              )}
              <button
                type="submit"
                aria-label="Submit search"
                className="bg-transparent border-none cursor-pointer p-0 text-secondary hover:text-accent transition-colors"
              >
                <Search size={15} />
              </button>
            </form>

            {ready && shown && (
              <ul
                id={listId}
                role="listbox"
                className="list-none m-0 p-0 border-t border-line max-h-96 overflow-y-auto"
              >
                {shown.length === 0 && (
                  <li className="px-4 py-3 text-[13px] text-secondary">
                    No products found for “{q}”.
                  </li>
                )}
                {shown.map((p, i) => (
                  <li
                    key={p.id}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={active === i}
                  >
                    <Link
                      href={`/products/${p.slug}`}
                      onClick={close}
                      className={`flex items-center gap-3 px-4 py-2 no-underline text-foreground ${active === i ? "bg-wash" : "hover:bg-wash"}`}
                    >
                      <span className="relative w-10 h-10 shrink-0 bg-wash">
                        {p.img && (
                          <Image
                            src={p.img}
                            alt=""
                            fill
                            className="object-contain"
                            unoptimized
                          />
                        )}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] truncate">
                          {p.name}
                        </span>
                        <span className="block text-[12px] text-secondary">
                          {p.salePrice ?? p.price}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
                <li
                  id={`${listId}-${shown.length}`}
                  role="option"
                  aria-selected={active === shown.length}
                >
                  <Link
                    href={allHref}
                    onClick={close}
                    className={`block px-4 py-2.5 text-[13px] font-semibold text-accent no-underline border-t border-line ${active === shown.length ? "bg-wash" : "hover:bg-wash"}`}
                  >
                    See all results for “{q}”
                  </Link>
                </li>
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
