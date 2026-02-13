// src/validators/campaign.validator.ts
// Zod schemas for Campaign API validation

import { z } from 'zod';

/**
 * Valid game types
 */
const GameTypeEnum = z.enum(['wheel', 'shake', 'memory', 'tap']);

/**
 * Campaign ID param
 */
export const campaignIdParamSchema = z.object({
  id: z.coerce.number().int().positive('ID không hợp lệ'),
});

/**
 * List campaigns query params
 */
export const listCampaignsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(['all', 'active', 'ended']).default('all'),
});

/**
 * Create campaign schema
 */
export const createCampaignSchema = z.object({
  name: z
    .string()
    .min(1, 'Tên chương trình không được để trống')
    .max(200, 'Tên chương trình tối đa 200 ký tự')
    .trim(),
  description: z
    .string()
    .max(1000, 'Mô tả tối đa 1000 ký tự')
    .trim()
    .optional()
    .nullable(),
  startDate: z
    .string()
    .datetime({ message: 'Ngày bắt đầu phải là ISO datetime' })
    .or(z.date()),
  endDate: z
    .string()
    .datetime({ message: 'Ngày kết thúc phải là ISO datetime' })
    .or(z.date()),
  activeGame: GameTypeEnum,
  gameConfig: z
    .record(z.any())
    .optional()
    .nullable()
    .describe('JSON config for game'),
  maxPlaysPerPhone: z
    .number()
    .int()
    .min(1, 'Số lượt chơi tối thiểu là 1')
    .max(100, 'Số lượt chơi tối đa là 100')
    .default(1),
  isActive: z.boolean().default(false),
});

/**
 * Update campaign schema (all fields optional)
 */
export const updateCampaignSchema = z.object({
  name: z
    .string()
    .min(1, 'Tên chương trình không được để trống')
    .max(200, 'Tên chương trình tối đa 200 ký tự')
    .trim()
    .optional(),
  description: z
    .string()
    .max(1000, 'Mô tả tối đa 1000 ký tự')
    .trim()
    .optional()
    .nullable(),
  startDate: z
    .string()
    .datetime({ message: 'Ngày bắt đầu phải là ISO datetime' })
    .or(z.date())
    .optional(),
  endDate: z
    .string()
    .datetime({ message: 'Ngày kết thúc phải là ISO datetime' })
    .or(z.date())
    .optional(),
  activeGame: GameTypeEnum.optional(),
  gameConfig: z
    .record(z.any())
    .optional()
    .nullable()
    .describe('JSON config for game'),
  maxPlaysPerPhone: z
    .number()
    .int()
    .min(1, 'Số lượt chơi tối thiểu là 1')
    .max(100, 'Số lượt chơi tối đa là 100')
    .optional(),
  isActive: z.boolean().optional(),
});

// Export types
export type CampaignIdParam = z.infer<typeof campaignIdParamSchema>;
export type ListCampaignsQuery = z.infer<typeof listCampaignsQuerySchema>;
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
