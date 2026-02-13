// src/controllers/game.controller.ts
// Game API controllers

import { Request, Response, NextFunction } from 'express';
import { gameEngine } from '../engines/GameEngine';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middlewares/error.middleware';
import { ERROR_CODES } from '../types/api.types';

/**
 * POST /api/game/play
 * Play game and receive result
 */
export const playGame = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Player is attached by requirePlayer middleware
    const player = req.player;
    if (!player) {
      throw new AppError(
        ERROR_CODES.UNAUTHORIZED,
        'Player authentication required',
        401
      );
    }

    const { gameType, gameData } = req.body;

    // Get active campaign
    const activeCampaign = await gameEngine.getActiveCampaign();
    if (!activeCampaign) {
      throw new AppError(
        ERROR_CODES.CAMPAIGN_NOT_ACTIVE,
        'Không có chương trình nào đang hoạt động',
        400
      );
    }

    // Verify game type matches campaign's active game
    if (activeCampaign.activeGame !== gameType) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        `Game type không khớp. Chương trình hiện tại đang chơi game: ${activeCampaign.activeGame}`,
        400
      );
    }

    // Get client IP and user agent for logging
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      '';
    const userAgent = req.headers['user-agent'] || '';

    // Process game play
    const result = await gameEngine.play(
      player.id,
      activeCampaign.id,
      gameType,
      gameData,
      ipAddress,
      userAgent
    );

    // Prepare response message
    let message = '';
    if (result.isWin) {
      message = `🎉 Chúc mừng bạn đã trúng ${result.reward?.name}!`;
    } else {
      message = 'Chúc bạn may mắn lần sau! 🍀';
    }

    return sendSuccess(res, result, message);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/game/eligibility
 * Check if player can play (alternative endpoint)
 */
export const checkEligibility = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const player = req.player;
    if (!player) {
      throw new AppError(
        ERROR_CODES.UNAUTHORIZED,
        'Player authentication required',
        401
      );
    }

    // Get active campaign
    const activeCampaign = await gameEngine.getActiveCampaign();
    if (!activeCampaign) {
      return sendSuccess(res, {
        canPlay: false,
        remainingPlays: 0,
        maxPlays: 0,
        reason: 'CAMPAIGN_NOT_ACTIVE',
        message: 'Không có chương trình nào đang hoạt động',
      });
    }

    // Check eligibility
    const eligibility = await gameEngine.checkEligibility(
      player.id,
      activeCampaign.id
    );

    return sendSuccess(res, eligibility);
  } catch (error) {
    next(error);
  }
};
