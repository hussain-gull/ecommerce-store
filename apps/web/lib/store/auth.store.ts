import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "@ecommerce/contracts";

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  setAuth: (user: AuthUser, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => set({ user, accessToken }),
      setAccessToken: (accessToken) => set({ accessToken }),
      clearAuth: () => set({ user: null, accessToken: null }),
    }),
    {
      name: "auth",
      // Never persist the access token: localStorage is readable by any script
      // that lands on the page (XSS). After a reload the first authed request
      // 401s and the axios interceptor silently refreshes via the HttpOnly cookie.
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
