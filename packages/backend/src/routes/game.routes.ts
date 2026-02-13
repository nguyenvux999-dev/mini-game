// src/routes/game.routes.ts
// Game API routes

import { Router } from 'express';
import { playGame, checkEligibility } from '../controllers/game.controller';
import { validateBody } from '../middlewares/validation.middleware';
import { requirePlayer } from '../middlewares/player.middleware';
import { playLimiter } from '../middlewares/rateLimit.middleware';
import { playGameSchema } from '../validators/game.validator';

const router = Router();

/**
 * @route   POST /api/game/play
 * @desc    Play game and receive result
 * @access  Player (X-Player-Token required)
 */
router.post(
  '/play',
  playLimiter,
  requirePlayer,
  validateBody(playGameSchema),
  playGame
);

/**
 * @route   GET /api/game/eligibility
 * @desc    Check if player can play
 * @access  Player (X-Player-Token required)
 */
router.get('/eligibility', requirePlayer, checkEligibility);

export default router;
