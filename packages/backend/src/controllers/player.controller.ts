// src/controllers/player.controller.ts
// Controller for Player API endpoints

import { Request, Response, NextFunction } from 'express';
import { playerService } from '../services/player.service';
import { sendSuccess } from '../utils/response';
import { RegisterPlayerInput } from '../validators/player.validator';

/**
 * Player Controller
 * Handles HTTP requests for player endpoints
 */
export class PlayerController {
  /**
   * POST /api/players/register
   * Register or login player by phone number
   */
  async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const input: RegisterPlayerInput = req.body;
      const { data, message } = await playerService.registerPlayer(input);
      sendSuccess(res, data, message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/players/:id/eligibility
   * Check if player can play
   */
  async checkEligibility(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const playerId = req.player!.id; // From requirePlayer middleware
      const eligibility = await playerService.checkEligibility(playerId);
      sendSuccess(res, eligibility);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/players
   * List all players with pagination and search (Admin)
   */
  async listPlayers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = req.query as unknown as { page: number; limit: number; search?: string };
      const data = await playerService.listPlayers(query);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/players/:id
   * Get player detail with vouchers and play history (Admin)
   */
  async getPlayerDetail(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const data = await playerService.getPlayerDetail(id);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const playerController = new PlayerController();
export default playerController;
