// Re-export shared schemas from contracts — single source of truth for validation rules.
// UI-only fields (confirm password) are added here and stripped before sending to the API.
import { z } from "zod";
import {
  signupSchema as _signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema as _resetPasswordSchema,
} from "@ecommerce/contracts";

export { loginSchema, forgotPasswordSchema };
export type {
  LoginFormValues,
  ForgotPasswordFormValues,
} from "@ecommerce/contracts";

export const signupSchema = _signupSchema
  .extend({
    confirm: z.string().min(1, "Please confirm your password"),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

export type SignupFormValues = z.infer<typeof signupSchema>;

// token is a URL param passed as a prop — not a form field, so omit it from validation.
export const resetPasswordSchema = _resetPasswordSchema
  .omit({ token: true })
  .extend({
    confirm: z.string().min(1, "Please confirm your new password"),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
