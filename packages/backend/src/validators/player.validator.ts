// src/validators/player.validator.ts
// Zod validation schemas for Player API với Input Sanitization chống XSS

import { z } from 'zod';

/**
 * Vietnamese phone number validation regex
 * Format: 03|05|07|08|09 + 8 digits
 * Example: 0909123456
 */
const PHONE_REGEX = /^(03|05|07|08|09)+([0-9]{8})\b/;

/**
 * HTML Escape function - Chống XSS attacks
 * Chuyển đổi các ký tự đặc biệt thành HTML entities
 * < → &lt;  > → &gt;  & → &amp;  " → &quot;  ' → &#x27;
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return text.replace(/[&<>"'\/]/g, (char) => map[char]);
}

/**
 * Player registration/login validation với XSS Protection
 * 
 * Sanitization:
 * - phone: trim whitespace
 * - name: trim + escape HTML entities (chống XSS)
 * 
 * Validation:
 * - phone: Phải khớp với regex Việt Nam (03|05|07|08|09 + 8 số)
 * - name: Bắt buộc, min 2 ký tự, max 100 ký tự
 */
export const registerPlayerSchema = z.object({
  phone: z
    .string()
    .trim() // Loại bỏ khoảng trắng đầu cuối
    .min(1, 'Vui lòng nhập số điện thoại')
    .regex(PHONE_REGEX, 'Số điện thoại không hợp lệ (phải bắt đầu bằng 03|05|07|08|09 và có 10 chữ số)'),
  
  name: z
    .string()
    .trim() // Loại bỏ khoảng trắng đầu cuối
    .min(1, 'Vui lòng nhập tên') // Bắt buộc
    .min(2, 'Tên phải có ít nhất 2 ký tự')
    .max(100, 'Tên không được quá 100 ký tự')
    .transform((val) => escapeHtml(val)), // Escape HTML entities để chống XSS
});

/**
 * Player ID param validation
 */
export const playerIdParamSchema = z.object({
  id: z.coerce.number().int().positive('ID phải là số nguyên dương'),
});

/**
 * List players query validation (Admin)
 */
export const listPlayersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(), // Search by phone or name
});

// Export types
export type RegisterPlayerInput = z.infer<typeof registerPlayerSchema>;
export type PlayerIdParam = z.infer<typeof playerIdParamSchema>;
export type ListPlayersQuery = z.infer<typeof listPlayersQuerySchema>;

/**
 * Helper function to normalize phone number
 * Converts all formats to standard format: 0909123456
 */
export function normalizePhone(phone: string): string {
  // Remove all spaces and special characters
  let normalized = phone.replace(/[\s\-\(\)]/g, '');
  
  // Convert +84 or 84 to 0
  if (normalized.startsWith('+84')) {
    normalized = '0' + normalized.substring(3);
  } else if (normalized.startsWith('84')) {
    normalized = '0' + normalized.substring(2);
  }
  
  return normalized;
}
