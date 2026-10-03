import { create } from "zustand";

type ToastVariant = "success" | "error";

type ToastProduct = { img: string; name: string };

type Toast = {
  id: string;
  variant: ToastVariant;
  message: string;
  product?: ToastProduct;
};

type ToastState = {
  toasts: Toast[];
  push: (
    variant: ToastVariant,
    message: string,
    product?: ToastProduct,
  ) => void;
  remove: (id: string) => void;
};

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (variant, message, product) => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { id, variant, message, product }] }));
    setTimeout(
      () => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      4000,
    );
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
