"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import type { ApiErrorBody } from "@ecommerce/contracts";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/lib/schemas/auth.schema";
import { useResetPassword } from "@/lib/hooks/use-reset-password";
import { useToastStore } from "@/lib/store/toast.store";
import { FormInput } from "@/components/ui/form-input";

type Props = {
  token: string;
};

export function ResetPasswordForm({ token }: Props) {
  const router = useRouter();
  const push = useToastStore((s) => s.push);
  const [showPassword, setShowPassword] = useState(false);
  const { mutate: resetPassword, isPending } = useResetPassword();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  function onSubmit(values: ResetPasswordFormValues) {
    const { confirm: _confirm, ...payload } = values;
    resetPassword(
      { ...payload, token },
      {
        onSuccess: () => {
          push(
            "success",
            "Password updated successfully. Please sign in with your new password.",
          );
          router.push("/login");
        },
        onError: (err) => {
          const apiErr = err as unknown as ApiErrorBody;
          const msg =
            apiErr?.message ?? "Something went wrong. Please try again.";
          // Map field-level errors from the API
          apiErr.errors?.forEach(({ field, message }) => {
            if (field === "password") setError("password", { message });
            else setError("root.server", { message });
          });
          if (!apiErr.errors?.length) {
            setError("root.server", { message: msg });
          }
        },
      },
    );
  }

  const passwordToggle = (
    <button
      type="button"
      onClick={() => setShowPassword((p) => !p)}
      aria-label={showPassword ? "Hide password" : "Show password"}
      className="bg-transparent border-none cursor-pointer text-secondary hover:text-foreground transition-colors p-0"
    >
      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
    </button>
  );

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
        id="reset-password"
        label="New Password"
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
        placeholder="Min. 8 characters"
        required
        error={errors.password?.message}
        rightAddon={passwordToggle}
        {...register("password")}
      />

      <FormInput
        id="reset-confirm"
        label="Confirm New Password"
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
        placeholder="Repeat new password"
        required
        error={errors.confirm?.message}
        {...register("confirm")}
      />

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 w-full h-11 bg-foreground text-white border-none text-xs font-bold tracking-[2px] uppercase cursor-pointer hover:bg-accent transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "Updating…" : "Set New Password"}
      </button>
    </form>
  );
}
