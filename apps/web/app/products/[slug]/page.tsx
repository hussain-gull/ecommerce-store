import { notFound } from "next/navigation";
import { CURRENCY_CODE } from "@ecommerce/contracts";
import type { Metadata } from "next";
import { TopBar } from "@/components/layout/top-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProductDetail } from "@/components/product/detail";
import { getProductBySlugApi } from "@/lib/api/product.api";
import { getConditionGuideApi } from "@/lib/api/content.api";
import { branding } from "@ecommerce/contracts";

type Props = { params: Promise<{ slug: string }> };

// Product catalogue changes via the admin panel, not a deploy — no
// generateStaticParams/static export here, each request is server-rendered.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlugApi(slug);
  if (!product) return { title: "Product Not Found" };

  const title = `${product.name} — ${branding.storeName}`;
  const description = product.description.slice(0, 160);
  const image = product.media[0]?.src;

  return {
    title,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

// Product structured data — lets search results show price/rating/availability.
function productJsonLd(
  product: NonNullable<Awaited<ReturnType<typeof getProductBySlugApi>>>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    image: product.media.map((m) => m.src),
    ...(product.brand
      ? { brand: { "@type": "Brand", name: product.brand } }
      : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: CURRENCY_CODE,
      price: product.price.replace(/[^\d.]/g, ""),
      availability: "https://schema.org/InStock",
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, conditionGuide] = await Promise.all([
    getProductBySlugApi(slug),
    // Optional tab — never let it take the product page down.
    getConditionGuideApi().catch(() => null),
  ]);
  if (!product) notFound();

  return (
    <div className="font-sans bg-wash text-secondary">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd(product)),
        }}
      />
      <TopBar />
      <Header />
      <main>
        <ProductDetail {...product} conditionGuide={conditionGuide} />
      </main>
      <Footer />
    </div>
  );
}
