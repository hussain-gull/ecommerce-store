import type { Metadata } from "next";
import { TopBar } from "@/components/layout/top-bar";
import { Header } from "@/components/layout/header";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Footer } from "@/components/layout/footer";
import {
  AccountDashboard,
  type Tab,
} from "@/components/account/account-dashboard";
import { branding } from "@ecommerce/contracts";

export const metadata: Metadata = {
  title: `My Account — ${branding.storeName}`,
  description: `Manage your ${branding.storeName} account, orders, addresses, and personal information.`,
  robots: { index: false, follow: true },
};

const TABS: Tab[] = ["overview", "orders", "addresses", "profile", "wishlist"];

// `/account?tab=orders` opens that tab (e.g. the link after checkout).
export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const initialTab = TABS.find((t) => t === tab);
  return (
    <div className="font-sans bg-white text-secondary">
      <TopBar />
      <Header />
      <Breadcrumb
        crumbs={[{ label: "Home", href: "/" }, { label: "My Account" }]}
      />

      <div className="max-w-300 mx-auto px-4 py-10">
        <h1 className="text-xl font-bold text-foreground uppercase tracking-widest mb-8">
          <span className="text-secondary mr-1.5">/</span>My Account
          <span className="text-accent">.</span>
        </h1>
        <AccountDashboard initialTab={initialTab} />
      </div>

      <Footer />
    </div>
  );
}
