import { z } from "zod";
import type {
  SignupPayload,
  LoginPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from "../auth";
import { normalizePhone } from "../shared";

// ─── Single source of truth for auth validation rules ─────────────────────────
// Both the API (server-side) and the web app (client-side) import from here.
// The frontend extends signupSchema with a UI-only `confirm` field — see below.

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
}) satisfies z.ZodType<LoginPayload>;

export const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must not exceed 128 characters"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .transform(normalizePhone)
    .refine((v) => /^\+92\d{10}$/.test(v), {
      message:
        "Enter a valid Pakistani mobile number (e.g. 03XXXXXXXXXX or +923XXXXXXXXXX)",
    }),
}) satisfies z.ZodType<SignupPayload>;

// No body — refresh token arrives via HttpOnly cookie
export const refreshSchema = z.object({});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
}) satisfies z.ZodType<ForgotPasswordPayload>;

// Token is validated as a 64-char hex string on the server; the client sends the raw URL param.
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must not exceed 128 characters"),
}) satisfies z.ZodType<ResetPasswordPayload>;

// ─── Derived types ─────────────────────────────────────────────────────────────

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
