// src/validators/auth.validator.ts
// Zod validation schemas for Auth API

import { z } from 'zod';

/**
 * Login request validation
 */
export const loginSchema = z.object({
  username: z
    .string()
    .min(3, 'Username phải có ít nhất 3 ký tự')
    .max(50, 'Username không được quá 50 ký tự'),
  password: z
    .string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .max(100, 'Mật khẩu không được quá 100 ký tự'),
});

/**
 * Change password request validation
 */
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: z
    .string()
    .min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự')
    .max(100, 'Mật khẩu không được quá 100 ký tự')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số'
    ),
});

// Export types
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
