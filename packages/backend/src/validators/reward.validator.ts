// src/validators/reward.validator.ts
// Zod schemas for Reward API validation

import { z } from 'zod';

/**
 * Reward ID param
 */
export const rewardIdParamSchema = z.object({
  id: z.coerce.number().int().positive('ID không hợp lệ'),
});

/**
 * List rewards query params
 */
export const listRewardsQuerySchema = z.object({
  campaignId: z.coerce.number().int().positive().optional(),
});

/**
 * Create reward schema
 */
export const createRewardSchema = z.object({
  campaignId: z
    .number()
    .int()
    .positive('Campaign ID phải là số dương'),
  name: z
    .string()
    .min(1, 'Tên phần thưởng không được để trống')
    .max(200, 'Tên phần thưởng tối đa 200 ký tự')
    .trim(),
  description: z
    .string()
    .max(1000, 'Mô tả tối đa 1000 ký tự')
    .trim()
    .optional()
    .nullable(),
  iconUrl: z
    .string()
    .url('Icon URL không hợp lệ')
    .max(500, 'Icon URL tối đa 500 ký tự')
    .optional()
    .nullable(),
  probability: z
    .number()
    .int()
    .min(0, 'Tỉ lệ trúng tối thiểu là 0%')
    .max(100, 'Tỉ lệ trúng tối đa là 100%'),
  totalQuantity: z
    .number()
    .int()
    .positive('Số lượng phải là số dương')
    .optional()
    .nullable()
    .describe('NULL = không giới hạn'),
  value: z
    .number()
    .int()
    .min(0, 'Giá trị không được âm')
    .default(0),
  isActive: z.boolean().default(true),
  displayOrder: z
    .number()
    .int()
    .min(0, 'Thứ tự hiển thị không được âm')
    .default(0),
});

/**
 * Update reward schema (all fields optional except campaignId validation)
 */
export const updateRewardSchema = z.object({
  name: z
    .string()
    .min(1, 'Tên phần thưởng không được để trống')
    .max(200, 'Tên phần thưởng tối đa 200 ký tự')
    .trim()
    .optional(),
  description: z
    .string()
    .max(1000, 'Mô tả tối đa 1000 ký tự')
    .trim()
    .optional()
    .nullable(),
  iconUrl: z
    .string()
    .url('Icon URL không hợp lệ')
    .max(500, 'Icon URL tối đa 500 ký tự')
    .optional()
    .nullable(),
  probability: z
    .number()
    .int()
    .min(0, 'Tỉ lệ trúng tối thiểu là 0%')
    .max(100, 'Tỉ lệ trúng tối đa là 100%')
    .optional(),
  totalQuantity: z
    .number()
    .int()
    .positive('Số lượng phải là số dương')
    .optional()
    .nullable()
    .describe('NULL = không giới hạn'),
  value: z
    .number()
    .int()
    .min(0, 'Giá trị không được âm')
    .optional(),
  isActive: z.boolean().optional(),
  displayOrder: z
    .number()
    .int()
    .min(0, 'Thứ tự hiển thị không được âm')
    .optional(),
});

// Export types
export type RewardIdParam = z.infer<typeof rewardIdParamSchema>;
export type ListRewardsQuery = z.infer<typeof listRewardsQuerySchema>;
export type CreateRewardInput = z.infer<typeof createRewardSchema>;
export type UpdateRewardInput = z.infer<typeof updateRewardSchema>;
