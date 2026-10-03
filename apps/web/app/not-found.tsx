import type { Metadata } from "next";
import Link from "next/link";
import { StatusPage } from "@/components/layout/status-page";
import { primaryBtn, secondaryBtn } from "@/components/layout/status-panel";
import { branding } from "@ecommerce/contracts";

export const metadata: Metadata = {
  title: `Page not found — ${branding.storeName}`,
  robots: { index: false },
};

// Rendered for unknown URLs and for every notFound() call (unknown product/post slug).
export default function NotFound() {
  return (
    <StatusPage
      eyebrow="404"
      title="Page not found"
      message="The page you're looking for doesn't exist or has been moved."
    >
      <Link href="/" className={primaryBtn}>
        Go home
      </Link>
      <Link href="/shop" className={secondaryBtn}>
        Browse shop
      </Link>
    </StatusPage>
  );
}
