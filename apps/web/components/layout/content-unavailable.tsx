import Link from "next/link";
import { StatusPanel, primaryBtn } from "@/components/layout/status-panel";
import { RetryButton } from "@/components/layout/retry-button";
import { branding } from "@ecommerce/contracts";

// Inline block (no header/footer — the page already renders those) for pages
// whose database-backed content is missing or unusable.
export function ContentUnavailable() {
  return (
    <StatusPanel
      eyebrow="Coming soon"
      title="This page is being updated"
      message="We can't show this page's content right now. Please check back shortly."
    >
      <Link href="/" className={primaryBtn}>
        Go home
      </Link>
      <RetryButton />
    </StatusPanel>
  );
}

// Metadata for those pages: never index an empty shell.
export const unavailableMetadata = (title: string) => ({
  title: `${title} — ${branding.storeName}`,
  robots: { index: false, follow: true },
});
