import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AdminUser } from "@ecommerce/contracts";

type AdminAuthState = {
  user: AdminUser | null;
  accessToken: string | null;
  setAuth: (user: AdminUser, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  clearAuth: () => void;
};

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => set({ user, accessToken }),
      setAccessToken: (accessToken) => set({ accessToken }),
      clearAuth: () => set({ user: null, accessToken: null }),
    }),
    {
      name: "admin-auth",
      // Never persist the access token (readable by any injected script). After a
      // reload the first request 401s and axios silently refreshes via the cookie.
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
