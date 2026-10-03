"use client";

import React, { forwardRef, useEffect, useRef, useState } from "react";
import { useAnimate } from "framer-motion";
import { AnimatePresence, motion } from "framer-motion";

type FormInputProps = {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  rightLabel?: React.ReactNode;
  rightAddon?: React.ReactNode;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "id">;

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    { id, label, error, required, rightLabel, rightAddon, className, ...rest },
    ref,
  ) => {
    const [scope, animate] = useAnimate();
    const prevError = useRef<string | undefined>(undefined);
    const [errorVisible, setErrorVisible] = useState(!!error);

    // Fire shake animation whenever a new error is set
    useEffect(() => {
      if (error && error !== prevError.current) {
        void animate(
          scope.current,
          { x: [0, -9, 9, -7, 7, -4, 4, 0] },
          { duration: 0.38, ease: "easeInOut" },
        );
        setErrorVisible(true);
      }
      if (!error) setErrorVisible(false);
      prevError.current = error;
    }, [error, animate, scope]);

    return (
      <div className="flex flex-col gap-1.5">
        {/* Label row */}
        <div className="flex items-center justify-between">
          <label
            htmlFor={id}
            className="text-xs font-bold tracking-widest uppercase text-foreground"
          >
            {label}
            {required && (
              <span className="text-accent ml-1" aria-hidden>
                *
              </span>
            )}
          </label>
          {rightLabel && <span className="text-[11px]">{rightLabel}</span>}
        </div>

        {/* Input with optional right addon */}
        <div ref={scope} className="relative">
          <input
            ref={ref}
            id={id}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            className={[
              "w-full border bg-white px-3 py-2.5 text-[13px] text-foreground outline-none transition-colors",
              error ? "border-accent" : "border-line",
              rightAddon ? "pr-10" : "",
              className ?? "",
            ].join(" ")}
            {...rest}
          />
          {rightAddon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
              {rightAddon}
            </span>
          )}
        </div>

        {/* Error message */}
        <AnimatePresence>
          {errorVisible && error && (
            <motion.p
              id={`${id}-error`}
              role="alert"
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              transition={{ duration: 0.15 }}
              className="text-[12px] font-semibold text-accent"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  },
);

FormInput.displayName = "FormInput";
