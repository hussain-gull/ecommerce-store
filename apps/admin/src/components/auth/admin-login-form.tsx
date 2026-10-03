import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import {
  loginSchema,
  type LoginFormValues,
  type ApiErrorBody,
} from "@ecommerce/contracts";
import { useAdminLogin } from "@/lib/hooks/use-admin-login";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function AdminLoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const { mutate: login, isPending } = useAdminLogin();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  function onSubmit(values: LoginFormValues) {
    login(values, {
      onError: (err) => {
        const apiErr = err as ApiErrorBody;
        apiErr.errors?.forEach(({ field, message }) => {
          if (field === "email" || field === "password") {
            setError(field, { message });
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
      {errors.root?.server && (
        <p
          role="alert"
          className="text-destructive text-xs bg-destructive/10 px-3 py-2 rounded-md border border-destructive/20"
        >
          {errors.root.server.message}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="admin-login-email">Email</Label>
        <Input
          id="admin-login-email"
          type="email"
          autoComplete="email"
          placeholder="admin@example.com"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-destructive text-xs">{errors.email.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="admin-login-password">Password</Label>
        <div className="relative">
          <Input
            id="admin-login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-destructive text-xs">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isPending} className="mt-2 w-full">
        {isPending ? "Signing in…" : "Sign In"}
      </Button>
    </form>
  );
}
