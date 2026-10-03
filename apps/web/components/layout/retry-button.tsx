"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { secondaryBtn } from "@/components/layout/status-panel";

// Re-runs the current Server Component render (re-fetches the data) without a
// full page reload — for "unavailable" states that aren't thrown errors.
export function RetryButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
      className={`${secondaryBtn} disabled:opacity-60`}
    >
      {pending ? "Checking…" : "Try again"}
    </button>
  );
}
