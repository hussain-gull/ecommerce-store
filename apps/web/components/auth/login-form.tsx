"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import type { ApiErrorBody } from "@ecommerce/contracts";
import { loginSchema, type LoginFormValues } from "@/lib/schemas/auth.schema";
import { useLogin } from "@/lib/hooks/use-login";
import { FormInput } from "@/components/ui/form-input";

type Props = {
  onSuccess?: () => void;
  /** Where to go after sign-in when no onSuccess is given. */
  redirectTo?: string;
};

export function LoginForm({ onSuccess, redirectTo = "/account" }: Props) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const { mutate: login, isPending } = useLogin();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  function onSubmit(values: LoginFormValues) {
    login(values, {
      onSuccess: () => (onSuccess ? onSuccess() : router.push(redirectTo)),
      onError: (err) => {
        const apiErr = err as ApiErrorBody;
        // Map field-level server errors back into RHF
        apiErr.errors?.forEach(({ field, message }) => {
          if (field === "email" || field === "password") {
            setError(field, { message });
          } else {
            // Non-field error — set on a sentinel root field
            setError("root.server", { message: apiErr.message });
          }
        });
        if (!apiErr.errors?.length) {
          setError("root.server", {
            message: apiErr.message ?? "Login failed.",
          });
        }
      },
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-4"
    >
      {/* Server-level error banner */}
      {errors.root?.server && (
        <p
          role="alert"
          className="text-accent text-[13px] bg-accent/10 px-3 py-2.5 border border-accent/20 font-semibold"
        >
          {errors.root.server.message}
        </p>
      )}

      <FormInput
        id="login-email"
        label="Email Address"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
        error={errors.email?.message}
        {...register("email")}
      />

      <FormInput
        id="login-password"
        label="Password"
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        placeholder="••••••••"
        required
        error={errors.password?.message}
        rightLabel={
          <Link
            href="/forgot-password"
            className="text-secondary hover:text-accent transition-colors no-underline"
          >
            Forgot password?
          </Link>
        }
        rightAddon={
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="bg-transparent border-none cursor-pointer text-secondary hover:text-foreground transition-colors p-0"
          >
            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        }
        {...register("password")}
      />

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 w-full h-11 bg-foreground text-white border-none text-xs font-bold tracking-[2px] uppercase cursor-pointer hover:bg-accent transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}
