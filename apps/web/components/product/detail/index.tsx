import { ProductGallery } from "./product-gallery";
import { ProductInfo } from "./product-info";
import { ProductTabs } from "./product-tabs";
import { RelatedProducts } from "./related-products";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import type {
  ProductDetail as ProductDetailType,
  ConditionGuideContent,
} from "@ecommerce/contracts";

type ProductDetailProps = ProductDetailType & {
  conditionGuide?: ConditionGuideContent | null;
};

export function ProductDetail(props: ProductDetailProps) {
  const {
    id,
    slug,
    img,
    name,
    price,
    originalPrice,
    rating,
    sku,
    category,
    tags,
    description,
    media,
    sizes,
    colors,
    variants,
    relatedProducts = [],
    conditionGuide,
  } = props;

  const amount = (v: string) => Number(v.replace(/[^0-9.]/g, ""));
  const discount = originalPrice
    ? Math.round((1 - amount(price) / amount(originalPrice)) * 100)
    : 0;

  return (
    <div className="max-w-300 mx-auto px-4 py-8">
      <Breadcrumb
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          { label: name },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-12 mb-16 mt-8">
        <ProductGallery media={media} name={name} discount={discount} />
        <ProductInfo
          id={id}
          slug={slug}
          img={img}
          name={name}
          price={price}
          originalPrice={originalPrice}
          rating={rating}
          description={description}
          sku={sku}
          category={category}
          tags={tags}
          sizes={sizes}
          colors={colors}
          variants={variants}
        />
      </div>

      <ProductTabs description={description} conditionGuide={conditionGuide} />
      <RelatedProducts products={relatedProducts} />
    </div>
  );
}
