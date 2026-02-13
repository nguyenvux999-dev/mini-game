// src/routes/player.routes.ts
// Routes for Player API

import { Router } from 'express';
import { playerController } from '../controllers/player.controller';
import { getPlayerVouchers } from '../controllers/voucher.controller';
import { requirePlayer } from '../middlewares/player.middleware';
import { requireAdmin } from '../middlewares/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../middlewares/validation.middleware';
import { registerLimiter } from '../middlewares/rateLimit.middleware';
import { registerPlayerSchema, playerIdParamSchema, listPlayersQuerySchema } from '../validators/player.validator';
import { playerVouchersQuerySchema } from '../validators/voucher.validator';

const router = Router();

// =============================================================================
// ADMIN ROUTES (Must be defined before dynamic routes like /:id)
// =============================================================================

/**
 * @route   GET /api/players
 * @desc    List all players with pagination and search
 * @access  Admin
 */
router.get(
  '/',
  requireAdmin,
  validateQuery(listPlayersQuerySchema),
  (req, res, next) => playerController.listPlayers(req, res, next)
);

/**
 * @route   GET /api/players/:id
 * @desc    Get player detail with vouchers and play history
 * @access  Admin
 * @note    Must be defined after /api/players/:id/eligibility and /api/players/:id/vouchers
 */

// =============================================================================
// PUBLIC & PLAYER ROUTES
// =============================================================================

/**
 * @route   POST /api/players/register
 * @desc    Register or login player by phone number
 * @access  Public
 */
router.post(
  '/register',
  registerLimiter,
  validateBody(registerPlayerSchema),
  (req, res, next) => playerController.register(req, res, next)
);

/**
 * @route   GET /api/players/:id/eligibility
 * @desc    Check if player can play
 * @access  Player (requires X-Player-Token)
 */
router.get(
  '/:id/eligibility',
  requirePlayer,
  validateParams(playerIdParamSchema),
  (req, res, next) => playerController.checkEligibility(req, res, next)
);

/**
 * @route   GET /api/players/:id/vouchers
 * @desc    Get player's vouchers
 * @access  Player (requires X-Player-Token)
 */
router.get(
  '/:id/vouchers',
  requirePlayer,
  validateParams(playerIdParamSchema),
  validateQuery(playerVouchersQuerySchema),
  getPlayerVouchers
);

/**
 * @route   GET /api/players/:id
 * @desc    Get player detail (Admin endpoint - defined last to avoid conflicts)
 * @access  Admin
 */
router.get(
  '/:id',
  requireAdmin,
  validateParams(playerIdParamSchema),
  (req, res, next) => playerController.getPlayerDetail(req, res, next)
);

export default router;
