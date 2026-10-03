"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LogIn, X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  message: string;
};

export function AuthRequiredDialog({ open, onClose, message }: Props) {
  const router = useRouter();

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function goSignIn() {
    onClose();
    router.push("/login");
  }

  function goSignUp() {
    onClose();
    router.push("/signup");
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-foreground/60 z-50"
            onClick={onClose}
            aria-hidden
          />

          {/* Dialog */}
          <motion.div
            key="dialog"
            role="dialog"
            aria-modal
            aria-labelledby="auth-dialog-title"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
          >
            <div className="relative w-full max-w-sm bg-white border border-line p-8 pointer-events-auto">
              {/* Close */}
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-4 right-4 text-secondary hover:text-foreground transition-colors bg-transparent border-none cursor-pointer p-0"
              >
                <X size={16} />
              </button>

              {/* Icon */}
              <div className="mb-5 flex items-center justify-center w-10 h-10 border border-line bg-surface">
                <LogIn size={18} className="text-foreground" />
              </div>

              {/* Title */}
              <h2
                id="auth-dialog-title"
                className="text-[11px] font-bold uppercase tracking-widest text-foreground mb-2"
              >
                Sign In Required
              </h2>

              {/* Message */}
              <p className="text-[13px] text-secondary mb-7 leading-relaxed">
                {message}
              </p>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={goSignIn}
                  className="h-11 w-full bg-foreground text-white border-none text-[11px] font-bold tracking-[2px] uppercase cursor-pointer hover:bg-accent transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={goSignUp}
                  className="h-11 w-full bg-transparent border border-line text-foreground text-[11px] font-bold tracking-widest uppercase cursor-pointer hover:border-accent hover:text-accent transition-colors"
                >
                  Create Account
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
