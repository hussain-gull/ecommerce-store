import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Crumb = { label: string; href?: string };
type BreadcrumbProps = { crumbs: Crumb[] };

function breadcrumbJsonLd(crumbs: Crumb[]) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${baseUrl}${c.href}` } : {}),
    })),
  };
}

export function Breadcrumb({ crumbs }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="bg-surface border-b border-line py-2.5"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(crumbs)),
        }}
      />
      <div className="max-w-300 mx-auto px-4 flex items-center gap-1 text-xs text-secondary">
        {crumbs.map((c, i) => (
          <span key={c.label} className="flex items-center gap-1">
            {c.href ? (
              <Link
                href={c.href}
                className="text-secondary hover:text-accent transition-colors no-underline"
              >
                {c.label}
              </Link>
            ) : (
              <span className="text-foreground font-semibold">{c.label}</span>
            )}
            {i < crumbs.length - 1 && (
              <ChevronRight size={12} className="text-subtle" />
            )}
          </span>
        ))}
      </div>
    </nav>
  );
}
