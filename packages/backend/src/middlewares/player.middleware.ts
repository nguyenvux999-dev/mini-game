// src/middlewares/player.middleware.ts
// Player token authentication middleware

import { Request, Response, NextFunction } from 'express';
import { playerService } from '../services/player.service';
import { UnauthorizedError } from './error.middleware';
import prisma from '../config/database';

/**
 * Extract player token from X-Player-Token header
 */
function extractPlayerToken(header: string | undefined): string | null {
  return header || null;
}

/**
 * Player authentication middleware
 * Verifies player token and attaches player info to request
 */
export async function requirePlayer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from X-Player-Token header
    const token = extractPlayerToken(req.headers['x-player-token'] as string);

    if (!token) {
      throw new UnauthorizedError('Player token không được cung cấp');
    }

    // Verify token
    const payload = playerService.verifyPlayerToken(token);

    // Fetch player from database to ensure still exists
    const player = await prisma.player.findUnique({
      where: { id: payload.playerId },
      select: {
        id: true,
        phone: true,
        name: true,
      },
    });

    if (!player) {
      throw new UnauthorizedError('Player không tồn tại');
    }

    // Attach player to request
    req.player = player;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional player authentication
 * Attaches player info if token provided, but doesn't fail if not
 */
export async function optionalPlayer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractPlayerToken(req.headers['x-player-token'] as string);

    if (token) {
      const payload = playerService.verifyPlayerToken(token);
      
      const player = await prisma.player.findUnique({
        where: { id: payload.playerId },
        select: {
          id: true,
          phone: true,
          name: true,
        },
      });

      if (player) {
        req.player = player;
      }
    }

    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
}

export default {
  requirePlayer,
  optionalPlayer,
};
