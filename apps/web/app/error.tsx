"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import Link from "next/link";
import { StatusPage } from "@/components/layout/status-page";
import { primaryBtn, secondaryBtn } from "@/components/layout/status-panel";

// Catches any error thrown while rendering a route (including failed API
// fetches, which throw — see lib/api/server-fetch.ts). Sits inside the root
// layout, so providers/fonts stay intact; app/global-error.tsx covers the layout.
export default function RouteError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      eyebrow="Oops"
      title="Something went wrong"
      message="We couldn't load this page. This is usually temporary — please try again."
      digest={error.digest}
    >
      <button type="button" onClick={() => retry()} className={primaryBtn}>
        Try again
      </button>
      <Link href="/" className={secondaryBtn}>
        Go home
      </Link>
    </StatusPage>
  );
}
