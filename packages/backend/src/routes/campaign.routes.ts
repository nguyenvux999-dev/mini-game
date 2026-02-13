// src/routes/campaign.routes.ts
// Campaign API routes

import { Router } from 'express';
import {
  listCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  toggleCampaign,
} from '../controllers/campaign.controller';
import { requireAdmin } from '../middlewares/auth.middleware';
import {
  validateParams,
  validateBody,
  validateQuery,
} from '../middlewares/validation.middleware';
import {
  campaignIdParamSchema,
  listCampaignsQuerySchema,
  createCampaignSchema,
  updateCampaignSchema,
} from '../validators/campaign.validator';

const router = Router();

// All campaign routes require admin authentication

/**
 * @route   GET /api/campaigns
 * @desc    List all campaigns with pagination & filters
 * @access  Admin (Bearer Token required)
 */
router.get(
  '/',
  requireAdmin,
  validateQuery(listCampaignsQuerySchema),
  listCampaigns
);

/**
 * @route   GET /api/campaigns/:id
 * @desc    Get campaign detail by ID
 * @access  Admin (Bearer Token required)
 */
router.get(
  '/:id',
  requireAdmin,
  validateParams(campaignIdParamSchema),
  getCampaignById
);

/**
 * @route   POST /api/campaigns
 * @desc    Create new campaign
 * @access  Admin (Bearer Token required)
 */
router.post(
  '/',
  requireAdmin,
  validateBody(createCampaignSchema),
  createCampaign
);

/**
 * @route   PUT /api/campaigns/:id
 * @desc    Update campaign
 * @access  Admin (Bearer Token required)
 */
router.put(
  '/:id',
  requireAdmin,
  validateParams(campaignIdParamSchema),
  validateBody(updateCampaignSchema),
  updateCampaign
);

/**
 * @route   PATCH /api/campaigns/:id/toggle
 * @desc    Toggle campaign active status
 * @access  Admin (Bearer Token required)
 */
router.patch(
  '/:id/toggle',
  requireAdmin,
  validateParams(campaignIdParamSchema),
  toggleCampaign
);

/**
 * @route   DELETE /api/campaigns/:id
 * @desc    Delete campaign
 * @access  Admin (Bearer Token required)
 */
router.delete(
  '/:id',
  requireAdmin,
  validateParams(campaignIdParamSchema),
  deleteCampaign
);

export default router;
