import { z } from "zod";

export const registerDto = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
});

export const loginDto = z.object({
  email: z.string().email().optional(),
  username: z.string().optional(),
  password: z.string().min(6),
});

export const verifyEmailDto = z.object({
  verificationToken: z.string(),
});

export const resendVerifyEmailDto = z.object({});

export const forgotPasswordDto = z.object({
  email: z.string().email(),
});

export const resetPasswordDto = z.object({
  resetToken: z.string(),
  newPassword: z.string().min(6),
});

export const changePasswordDto = z.object({
  oldPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

export type RegisterDto = z.infer<typeof registerDto>;
export type LoginDto = z.infer<typeof loginDto>;
export type VerifyEmailDto = z.infer<typeof verifyEmailDto>;
export type ResendVerifyEmailDto = z.infer<typeof resendVerifyEmailDto>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordDto>;
export type ResetPasswordDto = z.infer<typeof resetPasswordDto>;
export type ChangePasswordDto = z.infer<typeof changePasswordDto>;
