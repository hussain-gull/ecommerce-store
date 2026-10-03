import { create } from "zustand";
import { toast } from "sonner";

type ToastVariant = "success" | "error";

type ToastState = {
  push: (variant: ToastVariant, message: string) => void;
};

// Rendering delegates to shadcn's Sonner-based <Toaster/> (already mounted in
// App) instead of a hand-built toast list, matching web's push(variant, message)
// call shape used across the hooks below.
export const useToastStore = create<ToastState>(() => ({
  push: (variant, message) => toast[variant](message),
}));
