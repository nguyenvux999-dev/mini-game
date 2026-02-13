// src/routes/asset.routes.ts
// Routes for Asset API - File upload and management

import { Router } from 'express';
import {
  listAssets,
  getAssetById,
  uploadAsset,
  deleteAsset,
  updateAsset,
  toggleAsset,
} from '../controllers/asset.controller';
import { requireAdmin } from '../middlewares/auth.middleware';
import { validateParams, validateQuery, validateBody } from '../middlewares/validation.middleware';
import {
  assetIdParamSchema,
  listAssetsQuerySchema,
  uploadAssetBodySchema,
} from '../validators/asset.validator';
import { uploadSingle } from '../middlewares/upload.middleware';
import { uploadLimiter } from '../middlewares/rateLimit.middleware';

const router = Router();

/**
 * All asset routes require admin authentication
 */
router.use(requireAdmin);

/**
 * GET /api/assets
 * List assets with optional filtering by gameType/assetType
 * Supports pagination (page, limit)
 * 
 * Query params:
 * - gameType: wheel | shake | memory | tap (optional)
 * - assetType: background | character | icon | card | falling_object | sound (optional)
 * - page: number (default: 1)
 * - limit: number (default: 20)
 */
router.get('/', validateQuery(listAssetsQuerySchema), listAssets);

/**
 * GET /api/assets/:id
 * Get asset details by ID
 */
router.get('/:id', validateParams(assetIdParamSchema), getAssetById);

/**
 * POST /api/assets/upload
 * Upload new asset file
 * 
 * Content-Type: multipart/form-data
 * Body:
 * - file: image file (required, max 5MB)
 * - type: reward_icon | game_background | game_character | game_card (required)
 * - gameType: wheel | shake | memory | tap (optional)
 * - assetName: string (optional)
 * - description: string (optional)
 * - displayOrder: number (optional, default: 0)
 * 
 * Rate limited: 20 uploads per 15 minutes
 */
router.post(
  '/upload',
  uploadLimiter,
  uploadSingle,
  validateBody(uploadAssetBodySchema),
  uploadAsset
);

/**
 * PUT /api/assets/:id
 * Update asset metadata (does not change file)
 */
router.put(
  '/:id',
  validateParams(assetIdParamSchema),
  validateBody(uploadAssetBodySchema.partial()),
  updateAsset
);

/**
 * PATCH /api/assets/:id/toggle
 * Toggle asset active status
 */
router.patch(
  '/:id/toggle',
  validateParams(assetIdParamSchema),
  toggleAsset
);

/**
 * DELETE /api/assets/:id
 * Delete asset and remove file from disk
 */
router.delete('/:id', validateParams(assetIdParamSchema), deleteAsset);

export default router;
