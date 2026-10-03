"use client";

import Link from "next/link";
import { Phone, ShoppingBag, Heart } from "lucide-react";
import { SearchDropdown } from "./search-dropdown";
import { MenuDropdown } from "./menu-dropdown";
import { PK } from "country-flag-icons/react/3x2";
import { useCartStore } from "@/lib/store/cart.store";
import { useWishlistStore } from "@/lib/store/wishlist.store";
import branding from "@/content/branding.json";

export function TopBar() {
  const totalItems = useCartStore((s) => s.totalItems);
  const wishlistCount = useWishlistStore((s) => s.items.length);

  return (
    <div className="bg-wash border-b border-line text-xs py-2">
      <div className="max-w-300 mx-auto px-4 flex justify-between items-center">
        {/* Left: select + flag + phone */}
        <div className="flex items-center gap-4">
          {/*<SelectDropdown />*/}

          <div className="hidden md:flex items-center gap-1.5 text-secondary">
            <PK title="Pakistan" className="w-5 h-5" />
            <span>English</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-secondary">
            <Phone size={12} />
            <span>Phone: {branding.topBar.phone}</span>
          </div>
        </div>

        {/* Right: icons */}
        <div className="flex items-center gap-1">
          <SearchDropdown />
          <MenuDropdown />

          <Link
            href="/wishlist"
            aria-label="Wishlist"
            className="relative flex items-center justify-center w-9 h-9 text-foreground hover:text-accent transition-colors"
          >
            <Heart size={16} />
            {wishlistCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-accent text-white text-[9px] font-bold leading-none">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </Link>

          <Link
            href="/cart"
            aria-label="Shopping cart"
            className="relative flex items-center justify-center w-9 h-9 text-foreground hover:text-accent transition-colors"
          >
            <ShoppingBag size={16} />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-foreground text-white text-[9px] font-bold leading-none">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}
