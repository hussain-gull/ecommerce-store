import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import { SmoothScrollProvider } from "@/components/ui/smooth-scroll-provider";
import { ScrollProgressBar } from "@/components/ui/scroll-progress-bar";
import { QueryProvider } from "@/providers/query-provider";
import { ToastContainer } from "@/components/ui/toast-container";
import { CartWishlistHydrator } from "@/components/providers/cart-wishlist-hydrator";
import React from "react";
import { branding } from "@ecommerce/contracts";

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-open-sans",
  display: "swap",
});

export const metadata: Metadata = {
  // Resolves relative canonical/OG URLs (e.g. the shop page canonical).
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: branding.displayName,
  description: "Built for Pitch",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    siteName: branding.storeName,
    title: branding.displayName,
    description: "Built for Pitch",
    type: "website",
    images: [{ url: "/logo.png" }],
  },
  twitter: {
    card: "summary",
    title: branding.displayName,
    description: "Built for Pitch",
    images: ["/logo.png"],
  },
};

// Brand entity for search engines — pages inherit this via the layout, so
// generateMetadata overrides (product/blog/etc) don't need to repeat it.
function organizationJsonLd() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: branding.storeName,
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={openSans.variable}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd()),
          }}
        />
        <QueryProvider>
          <CartWishlistHydrator />
          <SmoothScrollProvider>
            <ScrollProgressBar />
            {children}
          </SmoothScrollProvider>
          <ToastContainer />
        </QueryProvider>
      </body>
    </html>
  );
}
