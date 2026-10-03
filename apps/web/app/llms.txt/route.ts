import { getProductsApi } from "@/lib/api/product.api";
import { getBlogContent } from "@/lib/api/blog.api";
import { branding } from "@ecommerce/contracts";

// Not a Next.js-native metadata route (unlike robots.ts/sitemap.ts) — llms.txt
// has no official spec, so this is a plain Route Handler returning text/plain.
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const [products, blogContent] = await Promise.all([
    getProductsApi().catch(() => []),
    getBlogContent().catch(() => null),
  ]);

  const productLines = products
    .map((p) =>
      `- [${p.name}](${baseUrl}/products/${p.slug}): ${p.brand ?? ""} ${p.category}`.trim(),
    )
    .join("\n");

  const blogLines = (blogContent?.posts ?? [])
    .map((p) => `- [${p.title}](${baseUrl}/blog/${p.slug}): ${p.excerpt}`)
    .join("\n");

  const body = `# ${branding.storeName}

> ${branding.description}

## Shop

- [All products](${baseUrl}/shop)
${productLines}

## Blog

${blogLines}

## Company

- [About](${baseUrl}/about-us)
- [Contact](${baseUrl}/contact-us)
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
