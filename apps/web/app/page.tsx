import type { Metadata } from "next";
import { getHomeContentApi } from "@/lib/api/content.api";
import { getProductsApi } from "@/lib/api/product.api";
import { TopBar } from "@/components/layout/top-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AnimatedHome } from "@/components/animated-home/animated-home";
import { ContentUnavailable } from "@/components/layout/content-unavailable";
import { branding } from "@ecommerce/contracts";

export const metadata: Metadata = {
  title: branding.storeName,
  description: `${branding.storeName} — ${branding.description}`,
};

// Refresh at most once a minute: admin edits show up without a redeploy, and a
// page that was built while content was missing heals itself.
export const revalidate = 60;

export default async function HomePage() {
  const [home, products] = await Promise.all([
    getHomeContentApi(),
    // The catalogue is optional on the home page — degrade to no product
    // sections rather than failing the whole page.
    getProductsApi().catch(() => []),
  ]);

  return (
    <div className="font-sans bg-wash text-secondary">
      <TopBar />
      <Header />
      <main>
        {home ? (
          <AnimatedHome home={home} products={products} />
        ) : (
          <ContentUnavailable />
        )}
      </main>
      <Footer />
    </div>
  );
}
