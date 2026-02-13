// src/validators/voucher.validator.ts
// Zod schemas for Voucher API validation

import { z } from 'zod';

/**
 * Voucher code param - 8 char alphanumeric
 */
export const voucherCodeParamSchema = z.object({
  code: z
    .string()
    .min(1, 'Mã voucher không được để trống')
    .max(20, 'Mã voucher không hợp lệ')
    .trim()
    .toUpperCase(),
});

/**
 * Voucher ID param
 */
export const voucherIdParamSchema = z.object({
  id: z.coerce.number().int().positive('ID không hợp lệ'),
});

/**
 * Redeem voucher body
 */
export const redeemVoucherSchema = z.object({
  notes: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
});

/**
 * Cancel voucher body
 */
export const cancelVoucherSchema = z.object({
  reason: z.string().max(500, 'Lý do tối đa 500 ký tự').optional(),
});

/**
 * List vouchers query params (admin)
 */
export const listVouchersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z
    .enum(['active', 'used', 'expired', 'cancelled', 'all'])
    .default('all'),
  campaignId: z.coerce.number().int().positive().optional(),
  search: z.string().max(50).optional(),
});

/**
 * Player vouchers query params
 */
export const playerVouchersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  status: z
    .enum(['active', 'used', 'expired', 'cancelled', 'all'])
    .default('all'),
});

// Export types
export type VoucherCodeParam = z.infer<typeof voucherCodeParamSchema>;
export type VoucherIdParam = z.infer<typeof voucherIdParamSchema>;
export type RedeemVoucherInput = z.infer<typeof redeemVoucherSchema>;
export type CancelVoucherInput = z.infer<typeof cancelVoucherSchema>;
export type ListVouchersQuery = z.infer<typeof listVouchersQuerySchema>;
export type PlayerVouchersQuery = z.infer<typeof playerVouchersQuerySchema>;
