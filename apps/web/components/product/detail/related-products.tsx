import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@ecommerce/contracts";

type RelatedProductsProps = { products: Product[] };

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) return null;
  return (
    <section>
      <h2 className="text-lg font-bold text-foreground uppercase tracking-[2px] mb-8">
        <span className="text-secondary mr-1.5">/</span>Related Products
        <span className="text-accent">.</span>
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
