import { z } from "zod";

/**
 * Returns the [check, params] pair for a "these two fields must match" Zod
 * `.refine()`, spread as `.refine(...passwordsMatchRefinement(...))`.
 */
function passwordsMatchRefinement(passwordField: string, confirmField: string) {
  return [
    (data: Record<string, unknown>) => data[passwordField] === data[confirmField],
    { message: "Passwords do not match", path: [confirmField] as PropertyKey[] },
  ] as const;
}

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    email: z.string().trim().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine(...passwordsMatchRefinement("password", "confirmPassword"));

export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resendVerificationSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
});

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Missing reset token"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine(...passwordsMatchRefinement("password", "confirmPassword"));

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmNewPassword: z.string(),
  })
  .refine(...passwordsMatchRefinement("newPassword", "confirmNewPassword"));

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
