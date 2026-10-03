"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  MapPin,
  User,
  Heart,
  LogOut,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuthStore } from "@/lib/store/auth.store";
import { logoutApi } from "@/lib/api/auth.api";
import { LoginForm } from "@/components/auth/login-form";
import { OverviewPanel } from "./overview-panel";
import { OrdersPanel } from "./orders-panel";
import { AddressesPanel } from "./addresses-panel";
import { ProfilePanel } from "./profile-panel";
import { WishlistGrid } from "@/components/wishlist/wishlist-grid";

export type Tab =
  "overview" | "orders" | "addresses" | "profile" | "wishlist" | "signin";

const NAV: { id: Tab; label: string; Icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", Icon: LayoutDashboard },
  { id: "orders", label: "Order History", Icon: Package },
  { id: "addresses", label: "Addresses", Icon: MapPin },
  { id: "profile", label: "Personal Info", Icon: User },
  { id: "wishlist", label: "Wishlist", Icon: Heart },
];

export function AccountDashboard({
  initialTab = "overview",
}: {
  initialTab?: Tab;
}) {
  const [active, setActive] = useState<Tab>(initialTab);
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const router = useRouter();

  async function handleSignOut() {
    await logoutApi().catch(() => {});
    clearAuth();
    router.push("/login");
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Sidebar */}
      <aside className="w-full lg:w-56 shrink-0">
        <nav aria-label="Account navigation">
          <ul className="list-none m-0 p-0 bg-surface border border-line">
            {NAV.map(({ id, label, Icon }) => (
              <li key={id}>
                <button
                  onClick={() => setActive(id)}
                  aria-current={active === id ? "page" : undefined}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left text-[12px] font-bold uppercase tracking-widest border-none cursor-pointer transition-colors border-b border-line last:border-b-0 ${
                    active === id
                      ? "bg-foreground text-white"
                      : "bg-transparent text-foreground hover:text-accent hover:bg-wash"
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              </li>
            ))}
            <li>
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-[12px] font-bold uppercase tracking-widest text-secondary hover:text-accent hover:bg-wash transition-colors border-none bg-transparent cursor-pointer text-left"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => setActive("signin")}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-[12px] font-bold uppercase tracking-widest border-none cursor-pointer transition-colors text-left ${
                    active === "signin"
                      ? "bg-foreground text-white"
                      : "bg-transparent text-foreground hover:text-accent hover:bg-wash"
                  }`}
                >
                  <LogOut size={14} className="rotate-180" />
                  Sign In
                </button>
              )}
            </li>
          </ul>
        </nav>
      </aside>

      {/* Panel */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {active === "overview" && <OverviewPanel onNavigate={setActive} />}
            {active === "orders" && <OrdersPanel />}
            {active === "addresses" && <AddressesPanel />}
            {active === "profile" && <ProfilePanel />}
            {active === "wishlist" && (
              <div>
                <h2 className="text-xs font-bold tracking-widest uppercase text-foreground mb-6 pb-3 border-b border-line">
                  Wishlist
                </h2>
                <WishlistGrid />
              </div>
            )}
            {active === "signin" && (
              <div className="max-w-lg mx-auto">
                <h2 className="text-xs font-bold tracking-widest uppercase text-foreground mb-6 pb-3 border-b border-line">
                  Sign In
                </h2>
                <LoginForm onSuccess={() => setActive("overview")} />
                <p className="text-center text-[13px] text-secondary mt-6">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/signup"
                    className="text-accent font-semibold no-underline hover:text-accent-dark transition-colors"
                  >
                    Create one
                  </Link>
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
