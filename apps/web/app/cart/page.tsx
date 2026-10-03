import type { Metadata } from "next";
import { TopBar } from "@/components/layout/top-bar";
import { Header } from "@/components/layout/header";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Footer } from "@/components/layout/footer";
import { CartPage } from "@/components/cart/cart-page";
import { branding } from "@ecommerce/contracts";

export const metadata: Metadata = {
  title: `Shopping Cart — ${branding.storeName}`,
  description: "Review your cart and proceed to checkout.",
  robots: { index: false, follow: true },
};

export default function CartRoute() {
  return (
    <div className="font-sans bg-white text-secondary">
      <TopBar />
      <Header />
      <Breadcrumb crumbs={[{ label: "Home", href: "/" }, { label: "Cart" }]} />

      <div className="max-w-300 mx-auto px-4 py-10">
        <h1 className="text-xl font-bold text-foreground uppercase tracking-widest mb-8">
          <span className="text-secondary mr-1.5">/</span>Shopping Cart
          <span className="text-accent">.</span>
        </h1>
        <CartPage />
      </div>

      <Footer />
    </div>
  );
}
