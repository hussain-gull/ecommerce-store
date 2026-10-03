"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/store/auth.store";
import { fetchAndHydrate } from "@/lib/utils/hydrate-stores";

/**
 * Runs once per user session on app start.
 * When the auth store has a persisted user (returning visitor), fetches the
 * authoritative cart and wishlist from the DB and replaces local store state.
 * Fires silently — never blocks the UI.
 */
export function CartWishlistHydrator() {
  const userId = useAuthStore((s) => s.user?.id);
  const ranRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId || ranRef.current === userId) return;
    ranRef.current = userId;
    fetchAndHydrate().catch(() => {});
  }, [userId]);

  return null;
}
