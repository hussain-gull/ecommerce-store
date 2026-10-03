import type { Metadata } from "next";
import { TopBar } from "@/components/layout/top-bar";
import { Header } from "@/components/layout/header";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Footer } from "@/components/layout/footer";
import { ShopView } from "@/components/shop/shop-view";
import { queryShopApi } from "@/lib/api/product.api";
import {
  activeFilterCount,
  parseShopParams,
  type RawSearchParams,
} from "@/lib/shop/params";
import { branding } from "@ecommerce/contracts";

type Props = { searchParams: Promise<RawSearchParams> };

// Filtered variants are near-duplicates of /shop: point search engines at the
// base page, and keep multi-filter combinations out of the index entirely.
export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const filters = parseShopParams(await searchParams);
  return {
    title: `Shop — ${branding.storeName}`,
    description: "Browse our full range of footwear.",
    alternates: { canonical: "/shop" },
    robots: activeFilterCount(filters) > 1 ? { index: false } : undefined,
  };
}

export default async function ShopPage({ searchParams }: Props) {
  const filters = parseShopParams(await searchParams);
  const initialResult = await queryShopApi(filters);

  return (
    <div className="font-sans bg-white text-secondary">
      <TopBar />
      <Header />
      <Breadcrumb crumbs={[{ label: "Home", href: "/" }, { label: "Shop" }]} />
      <div className="max-w-[1560px] mx-auto px-6 sm:px-8 lg:px-12 py-10 flex flex-col lg:flex-row gap-x-6 lg:items-start">
        <ShopView initialResult={initialResult} initialFilters={filters} />
      </div>
      <Footer />
    </div>
  );
}
