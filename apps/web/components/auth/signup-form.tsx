"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import type { ApiErrorBody } from "@ecommerce/contracts";
import { signupSchema, type SignupFormValues } from "@/lib/schemas/auth.schema";
import { useSignup } from "@/lib/hooks/use-signup";
import { FormInput } from "@/components/ui/form-input";

export function SignupForm({
  redirectTo = "/account",
}: {
  redirectTo?: string;
}) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const { mutate: signup, isPending } = useSignup();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignupFormValues>({ resolver: zodResolver(signupSchema) });

  function onSubmit(values: SignupFormValues) {
    const { confirm: _confirm, ...payload } = values;
    signup(payload, {
      onSuccess: () => router.push(redirectTo),
      onError: (err) => {
        const apiErr = err as ApiErrorBody;
        const fieldNames: (keyof SignupFormValues)[] = [
          "firstName",
          "lastName",
          "email",
          "password",
          "phone",
          "confirm",
        ];
        apiErr.errors?.forEach(({ field, message }) => {
          const matched = fieldNames.find((f) => f === field);
          if (matched) {
            setError(matched, { message });
          } else {
            setError("root.server", { message: apiErr.message });
          }
        });
        if (!apiErr.errors?.length) {
          setError("root.server", {
            message: apiErr.message ?? "Sign-up failed.",
          });
        }
      },
    });
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormInput
          id="signup-first"
          label="First Name"
          type="text"
          autoComplete="given-name"
          placeholder="James"
          required
          error={errors.firstName?.message}
          {...register("firstName")}
        />
        <FormInput
          id="signup-last"
          label="Last Name"
          type="text"
          autoComplete="family-name"
          placeholder="Smith"
          required
          error={errors.lastName?.message}
          {...register("lastName")}
        />
      </div>

      <FormInput
        id="signup-email"
        label="Email Address"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
        error={errors.email?.message}
        {...register("email")}
      />

      <FormInput
        id="signup-phone"
        label="Phone Number"
        type="tel"
        autoComplete="tel"
        placeholder="03XXXXXXXXXX or +923XXXXXXXXXX"
        required
        error={errors.phone?.message}
        {...register("phone")}
      />

      <FormInput
        id="signup-password"
        label="Password"
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
        placeholder="Min. 8 characters"
        required
        error={errors.password?.message}
        rightAddon={passwordToggle}
        {...register("password")}
      />

      <FormInput
        id="signup-confirm"
        label="Confirm Password"
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
        placeholder="Repeat password"
        required
        error={errors.confirm?.message}
        {...register("confirm")}
      />

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 w-full h-11 bg-foreground text-wash border-none text-xs font-bold tracking-[2px] uppercase cursor-pointer hover:bg-accent transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "Creating account…" : "Create Account"}
      </button>
    </form>
  );
}
