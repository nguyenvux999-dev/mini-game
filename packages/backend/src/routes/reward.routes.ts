// src/routes/reward.routes.ts
// Reward API routes

import { Router } from 'express';
import {
  listRewards,
  getRewardById,
  createReward,
  updateReward,
  deleteReward,
  toggleReward,
} from '../controllers/reward.controller';
import { requireAdmin } from '../middlewares/auth.middleware';
import {
  validateParams,
  validateBody,
  validateQuery,
} from '../middlewares/validation.middleware';
import {
  rewardIdParamSchema,
  listRewardsQuerySchema,
  createRewardSchema,
  updateRewardSchema,
} from '../validators/reward.validator';

const router = Router();

// All reward routes require admin authentication

/**
 * @route   GET /api/rewards
 * @desc    List all rewards with optional campaign filter
 * @access  Admin (Bearer Token required)
 */
router.get(
  '/',
  requireAdmin,
  validateQuery(listRewardsQuerySchema),
  listRewards
);

/**
 * @route   GET /api/rewards/:id
 * @desc    Get reward detail by ID
 * @access  Admin (Bearer Token required)
 */
router.get(
  '/:id',
  requireAdmin,
  validateParams(rewardIdParamSchema),
  getRewardById
);

/**
 * @route   POST /api/rewards
 * @desc    Create new reward
 * @access  Admin (Bearer Token required)
 */
router.post(
  '/',
  requireAdmin,
  validateBody(createRewardSchema),
  createReward
);

/**
 * @route   PUT /api/rewards/:id
 * @desc    Update reward
 * @access  Admin (Bearer Token required)
 */
router.put(
  '/:id',
  requireAdmin,
  validateParams(rewardIdParamSchema),
  validateBody(updateRewardSchema),
  updateReward
);

/**
 * @route   PATCH /api/rewards/:id/toggle
 * @desc    Toggle reward active status
 * @access  Admin (Bearer Token required)
 */
router.patch(
  '/:id/toggle',
  requireAdmin,
  validateParams(rewardIdParamSchema),
  toggleReward
);

/**
 * @route   DELETE /api/rewards/:id
 * @desc    Delete reward
 * @access  Admin (Bearer Token required)
 */
router.delete(
  '/:id',
  requireAdmin,
  validateParams(rewardIdParamSchema),
  deleteReward
);

export default router;
