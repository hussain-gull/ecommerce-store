import type { Metadata } from "next";
import { TopBar } from "@/components/layout/top-bar";
import { Header } from "@/components/layout/header";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Footer } from "@/components/layout/footer";
import { WishlistPage } from "@/components/wishlist/wishlist-page";
import { branding } from "@ecommerce/contracts";

export const metadata: Metadata = {
  title: `Wishlist — ${branding.storeName}`,
  description: "Your saved items.",
  robots: { index: false, follow: true },
};

export default function WishlistRoute() {
  return (
    <div className="font-sans bg-white text-secondary">
      <TopBar />
      <Header />
      <Breadcrumb
        crumbs={[{ label: "Home", href: "/" }, { label: "Wishlist" }]}
      />
      <WishlistPage />
      <Footer />
    </div>
  );
}
