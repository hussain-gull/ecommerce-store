import type { MetadataRoute } from "next";
import { getProductsApi } from "@/lib/api/product.api";
import { getBlogContent } from "@/lib/api/blog.api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/about-us`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/contact-us`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/blog`, changeFrequency: "weekly", priority: 0.6 },
  ];

  const [products, blogContent] = await Promise.all([
    getProductsApi().catch(() => []),
    getBlogContent().catch(() => null),
  ]);

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const blogRoutes: MetadataRoute.Sitemap = (blogContent?.posts ?? []).map(
    (post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.publishedAt,
      changeFrequency: "monthly",
      priority: 0.5,
    }),
  );

  return [...staticRoutes, ...productRoutes, ...blogRoutes];
}
