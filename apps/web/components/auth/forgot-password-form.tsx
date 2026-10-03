"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle } from "lucide-react";
import type { ApiErrorBody } from "@ecommerce/contracts";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/lib/schemas/auth.schema";
import { useForgotPassword } from "@/lib/hooks/use-forgot-password";
import { FormInput } from "@/components/ui/form-input";

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const { mutate: requestReset, isPending } = useForgotPassword();

  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  function onSubmit(values: ForgotPasswordFormValues) {
    requestReset(values, {
      onSuccess: () => {
        setSubmittedEmail(getValues("email"));
        setSubmitted(true);
      },
      onError: (err) => {
        const apiErr = err as unknown as ApiErrorBody;
        const msg =
          apiErr?.message ?? "Something went wrong. Please try again.";
        setError("root.server", { message: msg });
      },
    });
  }

  // ── Success state ────────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-5 py-4 text-center">
        <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
          <CheckCircle size={28} className="text-green-500" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-[15px] font-bold text-foreground uppercase tracking-widest mb-2">
            Check your inbox
          </h2>
          <p className="text-[13px] text-secondary leading-relaxed max-w-sm">
            If <strong className="text-foreground">{submittedEmail}</strong> is
            linked to an account, you&rsquo;ll receive a reset link shortly. It
            expires in&nbsp;1&nbsp;hour.
          </p>
        </div>
        <p className="text-[12px] text-secondary">
          Didn&rsquo;t receive it?{" "}
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="text-accent cursor-pointer font-semibold hover:text-accent-dark transition-colors"
          >
            Send again
          </button>
        </p>
      </div>
    );
  }

  // ── Form state ───────────────────────────────────────────────────────────────

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-4"
    >
      {errors.root?.server && (
        <p
          role="alert"
          className="text-accent text-[13px] bg-accent/10 px-3 py-2.5 border border-accent/20 font-semibold"
        >
          {errors.root.server.message}
        </p>
      )}

      <FormInput
        id="forgot-email"
        label="Email Address"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
        error={errors.email?.message}
        {...register("email")}
      />

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 w-full h-11 bg-foreground text-white border-none text-xs font-bold tracking-[2px] uppercase cursor-pointer hover:bg-accent transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "Sending…" : "Send Reset Link"}
      </button>
    </form>
  );
}
