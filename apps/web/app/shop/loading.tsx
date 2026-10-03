import { TopBar } from "@/components/layout/top-bar";
import { Header } from "@/components/layout/header";
import { Breadcrumb } from "@/components/layout/breadcrumb";

// Makes /shop partially prefetchable, so nav clicks paint this shell instantly.
export default function ShopLoading() {
  return (
    <div className="font-sans bg-white text-secondary">
      <TopBar />
      <Header />
      <Breadcrumb crumbs={[{ label: "Home", href: "/" }, { label: "Shop" }]} />
      <div className="max-w-300 mx-auto px-4 py-10 grid grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="aspect-square bg-wash animate-pulse" />
        ))}
      </div>
    </div>
  );
}
