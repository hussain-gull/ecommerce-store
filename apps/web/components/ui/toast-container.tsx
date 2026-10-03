"use client";

import Image from "next/image";
import { useToastStore } from "@/lib/store/toast.store";
import { AnimatePresence, motion } from "framer-motion";
import { X, ShoppingCart, Heart } from "lucide-react";

export function ToastContainer() {
  const { toasts, remove } = useToastStore();

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => {
          const isCart = t.message.toLowerCase().includes("cart");
          const isWishlist = t.message.toLowerCase().includes("wishlist");

          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="flex items-center gap-3 min-w-[280px] max-w-[340px] bg-foreground text-white border border-foreground shadow-dropdown pointer-events-auto"
            >
              {/* Product thumbnail */}
              {t.product ? (
                <div className="w-14 h-14 bg-white shrink-0 relative overflow-hidden">
                  <Image
                    src={t.product.img}
                    alt={t.product.name}
                    fill
                    className="object-contain p-1"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-14 h-14 shrink-0 flex items-center justify-center bg-white/10">
                  {isWishlist ? (
                    <Heart size={18} className="text-accent" />
                  ) : (
                    <ShoppingCart size={18} />
                  )}
                </div>
              )}

              {/* Text */}
              <div className="flex-1 py-3 pr-0 min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-widest text-white/60 mb-0.5">
                  {isCart ? "Cart" : isWishlist ? "Wishlist" : "Notice"}
                </p>
                <p className="text-[13px] font-semibold leading-snug truncate">
                  {t.product ? t.product.name : t.message}
                </p>
                {t.product && (
                  <p className="text-[11px] text-white/60 mt-0.5">
                    {t.message}
                  </p>
                )}
              </div>

              {/* Dismiss */}
              <button
                onClick={() => remove(t.id)}
                aria-label="Dismiss"
                className="shrink-0 mr-3 opacity-50 hover:opacity-100 transition-opacity bg-transparent border-none cursor-pointer p-0 text-white"
              >
                <X size={13} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
