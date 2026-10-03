"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";
import { navItems } from "@/lib/data/navigation";
import { NavDropdown } from "./nav-dropdown";
import { branding as store } from "@ecommerce/contracts";
import branding from "@/content/branding.json";

export function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string | undefined) => {
    if (!href || href === "#") return false;
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  };

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsScrolled(!entry!.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Sentinel: when this leaves the viewport, header is considered "scrolled" */}
      <div ref={sentinelRef} className="h-px w-full" aria-hidden />

      <header
        className={`bg-header h-20 z-500 w-full sticky top-0 transition-shadow duration-300 ${
          isScrolled ? "shadow-sticky" : ""
        }`}
      >
        <div className="max-w-300 mx-auto h-full flex items-center justify-between px-4">
          <Link href="/" aria-label={`${store.storeName} — Home`}>
            <Image
              src={store.logo}
              alt={store.storeName}
              width={160}
              height={64}
              priority
              style={{ height: 48, width: "auto" }}
            />
          </Link>

          <nav aria-label="Main navigation" className="hidden md:flex">
            <ul className="flex list-none m-0 p-0">
              {navItems.map((item) => (
                <li
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(item.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <Link
                    href={item.href ?? "#"}
                    className={`flex items-center gap-1 text-[13px] font-bold uppercase tracking-widest px-5 leading-20 no-underline whitespace-nowrap transition-colors ${
                      isActive(item.href)
                        ? "text-accent"
                        : "text-foreground hover:text-accent"
                    }`}
                  >
                    {item.label}
                    {item.children && item.children.length > 0 && (
                      <ChevronDown
                        size={13}
                        className={`transition-transform duration-200 ${openDropdown === item.label ? "rotate-180" : ""}`}
                      />
                    )}
                  </Link>
                  <AnimatePresence>
                    {item.children &&
                      item.children.length > 0 &&
                      openDropdown === item.label && (
                        <NavDropdown items={item.children} />
                      )}
                  </AnimatePresence>
                </li>
              ))}
            </ul>
          </nav>

          <button
            onClick={() => setMobileOpen((p) => !p)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            className="md:hidden bg-transparent border-none cursor-pointer p-2 text-foreground"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="md:hidden bg-overlay absolute top-20 left-0 right-0 z-600 shadow-dropdown"
            >
              <ul className="list-none m-0 py-2">
                {navItems.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href ?? "#"}
                      className={`block text-[13px] font-bold uppercase tracking-widest px-5 py-3 no-underline ${
                        isActive(item.href) ? "text-accent" : "text-subtle"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
