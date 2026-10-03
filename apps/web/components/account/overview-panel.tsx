"use client";

import Link from "next/link";
import { Package, MapPin, Heart } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth.store";
import { useWishlistStore } from "@/lib/store/wishlist.store";
import { useMyOrders } from "@/lib/hooks/use-orders";
import { useAddresses } from "@/lib/hooks/use-addresses";
import type { Tab } from "./account-dashboard";

export function OverviewPanel({
  onNavigate,
}: {
  onNavigate: (tab: Tab) => void;
}) {
  const user = useAuthStore((s) => s.user);
  const { data: addresses } = useAddresses();
  const { data: orders } = useMyOrders();
  const wishlistCount = useWishlistStore((s) => s.items.length);

  const stats = [
    {
      Icon: Package,
      count: orders?.length ?? 0,
      label: "Orders",
      tab: "orders" as Tab,
    },
    {
      Icon: MapPin,
      count: addresses?.length ?? 0,
      label: "Addresses",
      tab: "addresses" as Tab,
    },
    {
      Icon: Heart,
      count: wishlistCount,
      label: "Wishlist Items",
      tab: "wishlist" as Tab,
    },
  ];

  const links: { label: string; tab: Tab }[] = [
    { label: "View Order History", tab: "orders" },
    { label: "Manage Addresses", tab: "addresses" },
    { label: "My Wishlist", tab: "wishlist" },
  ];

  return (
    <div>
      <h2 className="text-xs font-bold tracking-widest uppercase text-foreground mb-6 pb-3 border-b border-line">
        Account Overview
      </h2>

      <p className="text-[13px] text-secondary mb-6 leading-relaxed">
        Hello,{" "}
        <span className="text-foreground font-semibold">
          {user ? user.firstName : "Guest"}
        </span>
        . Welcome to your account dashboard. From here you can manage your
        orders, addresses, and personal details.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map(({ Icon, count, label, tab }) => (
          <button
            key={label}
            onClick={() => onNavigate(tab)}
            className="bg-surface border border-line p-5 text-center hover:border-accent transition-colors cursor-pointer"
          >
            <Icon size={22} className="text-accent mx-auto mb-2" />
            <p className="text-xl font-bold text-foreground">{count}</p>
            <p className="text-[11px] uppercase tracking-widest text-secondary mt-1">
              {label}
            </p>
          </button>
        ))}
      </div>

      <div className="bg-surface border border-line p-5">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-foreground mb-4">
          Quick Links
        </h3>
        <ul className="list-none m-0 p-0 space-y-2">
          {links.map((l) => (
            <li key={l.label}>
              <button
                onClick={() => onNavigate(l.tab)}
                className="text-[13px] text-secondary hover:text-accent transition-colors flex items-center gap-2 bg-transparent border-none p-0 cursor-pointer text-left"
              >
                <span className="text-[10px] text-accent">○</span>
                {l.label}
              </button>
            </li>
          ))}
          <li>
            <Link
              href="/shop"
              className="text-[13px] text-secondary hover:text-accent transition-colors no-underline flex items-center gap-2"
            >
              <span className="text-[10px] text-accent">○</span>
              Continue Shopping
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
