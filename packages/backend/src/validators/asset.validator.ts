// src/validators/asset.validator.ts
// Zod validation schemas for Asset API requests

import { z } from 'zod';

/**
 * Schema for asset ID param
 */
export const assetIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/**
 * Schema for GET /api/assets query params
 * Supports filtering by gameType and assetType
 */
export const listAssetsQuerySchema = z.object({
  gameType: z
    .enum(['wheel', 'shake', 'memory', 'tap'])
    .optional(),
  assetType: z
    .enum(['background', 'character', 'icon', 'card', 'falling_object', 'sound'])
    .optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * Schema for POST /api/assets/upload body
 * Validates metadata for uploaded file
 */
export const uploadAssetBodySchema = z.object({
  type: z.enum([
    'reward_icon',
    'game_background',
    'game_character',
    'game_card',
  ]),
  gameType: z
    .enum(['wheel', 'shake', 'memory', 'tap'])
    .optional(),
  assetName: z
    .string()
    .min(1, 'Asset name is required')
    .max(255, 'Asset name too long')
    .optional(),
  description: z
    .string()
    .max(500, 'Description too long')
    .optional(),
  displayOrder: z
    .coerce
    .number()
    .int()
    .min(0)
    .optional()
    .default(0),
});

/**
 * Type inference
 */
export type AssetIdParam = z.infer<typeof assetIdParamSchema>;
export type ListAssetsQuery = z.infer<typeof listAssetsQuerySchema>;
export type UploadAssetBody = z.infer<typeof uploadAssetBodySchema>;
