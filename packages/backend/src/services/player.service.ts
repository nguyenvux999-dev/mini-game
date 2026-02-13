// src/services/player.service.ts
// Service layer for Player API - handles player registration and eligibility

import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import prisma from '../config/database';
import config from '../config';
import { AppError } from '../middlewares/error.middleware';
import { ERROR_CODES } from '../types/api.types';
import { RegisterPlayerInput, normalizePhone } from '../validators/player.validator';

// Player JWT payload type
interface PlayerJwtPayload {
  playerId: number;
  phone: string;
}

// Player response type
interface PlayerResponse {
  id: number;
  phone: string;
  name: string | null;
  playCount: number;
  totalWins: number;
}

// Registration response type
interface RegisterResponse {
  player: PlayerResponse;
  token: string;
  campaign: {
    id: number;
    remainingPlays: number;
    maxPlays: number;
  } | null;
}

// Eligibility response type
interface EligibilityResponse {
  canPlay: boolean;
  remainingPlays: number;
  maxPlays: number;
  nextPlayAt: Date | null;
  reason?: string;
  message?: string;
}

/**
 * Player Service
 * Handles all player-related business logic
 */
export class PlayerService {
  /**
   * Register or login player by phone number
   */
  async registerPlayer(input: RegisterPlayerInput): Promise<{
    data: RegisterResponse;
    message: string;
  }> {
    // Normalize phone number
    const phone = normalizePhone(input.phone);

    // Find active campaign
    const now = new Date();
    const activeCampaign = await prisma.campaign.findFirst({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    if (!activeCampaign) {
      throw new AppError(
        ERROR_CODES.CAMPAIGN_NOT_ACTIVE,
        'Hiện tại không có chương trình nào đang diễn ra',
        400
      );
    }

    // Check if player exists
    let player = await prisma.player.findUnique({
      where: { phone },
    });

    let isNewPlayer = false;

    if (player) {
      // Update name - name is now required after validation
      if (input.name !== player.name) {
        player = await prisma.player.update({
          where: { id: player.id },
          data: { name: input.name },
        });
      }
    } else {
      // Create new player - name is required
      player = await prisma.player.create({
        data: {
          phone,
          name: input.name,
        },
      });
      isNewPlayer = true;
    }

    // Count plays for this campaign
    const playCount = await prisma.playLog.count({
      where: {
        playerId: player.id,
        campaignId: activeCampaign.id,
      },
    });

    const remainingPlays = Math.max(0, activeCampaign.maxPlaysPerPhone - playCount);

    // Generate player token
    const payload: PlayerJwtPayload = {
      playerId: player.id,
      phone: player.phone,
    };

    const token = jwt.sign(
      payload,
      config.jwt.secret as Secret,
      { expiresIn: '30d' } as SignOptions
    );

    return {
      data: {
        player: {
          id: player.id,
          phone: player.phone,
          name: player.name,
          playCount: player.playCount,
          totalWins: player.totalWins,
        },
        token,
        campaign: {
          id: activeCampaign.id,
          remainingPlays,
          maxPlays: activeCampaign.maxPlaysPerPhone,
        },
      },
      message: isNewPlayer
        ? `Đăng ký thành công! Bạn có ${remainingPlays} lượt chơi.`
        : 'Chào mừng trở lại!',
    };
  }

  /**
   * Check if player is eligible to play
   */
  async checkEligibility(playerId: number): Promise<EligibilityResponse> {
    // Find player
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        'Player không tồn tại',
        404
      );
    }

    // Find active campaign
    const now = new Date();
    const activeCampaign = await prisma.campaign.findFirst({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    if (!activeCampaign) {
      return {
        canPlay: false,
        remainingPlays: 0,
        maxPlays: 0,
        nextPlayAt: null,
        reason: 'CAMPAIGN_NOT_ACTIVE',
        message: 'Chương trình chưa bắt đầu hoặc đã kết thúc',
      };
    }

    // Count plays for this campaign
    const playCount = await prisma.playLog.count({
      where: {
        playerId: player.id,
        campaignId: activeCampaign.id,
      },
    });

    const remainingPlays = Math.max(0, activeCampaign.maxPlaysPerPhone - playCount);

    if (remainingPlays <= 0) {
      return {
        canPlay: false,
        remainingPlays: 0,
        maxPlays: activeCampaign.maxPlaysPerPhone,
        nextPlayAt: null,
        reason: 'NO_PLAYS_LEFT',
        message: 'Bạn đã hết lượt chơi. Cảm ơn bạn đã tham gia!',
      };
    }

    return {
      canPlay: true,
      remainingPlays,
      maxPlays: activeCampaign.maxPlaysPerPhone,
      nextPlayAt: null,
    };
  }

  /**
   * Verify player token and return payload
   */
  verifyPlayerToken(token: string): PlayerJwtPayload {
    try {
      const payload = jwt.verify(token, config.jwt.secret) as PlayerJwtPayload;
      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError(
          ERROR_CODES.INVALID_TOKEN,
          'Token đã hết hạn',
          401
        );
      }
      throw new AppError(
        ERROR_CODES.INVALID_TOKEN,
        'Token không hợp lệ',
        401
      );
    }
  }

  /**
   * Get player by ID
   */
  async getPlayerById(id: number): Promise<PlayerResponse | null> {
    const player = await prisma.player.findUnique({
      where: { id },
    });

    if (!player) return null;

    return {
      id: player.id,
      phone: player.phone,
      name: player.name,
      playCount: player.playCount,
      totalWins: player.totalWins,
    };
  }

  /**
   * List all players with pagination and search (Admin)
   */
  async listPlayers(query: { page: number; limit: number; search?: string }) {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Search by phone or name (case-insensitive for SQLite)
    if (search) {
      where.OR = [
        { phone: { contains: search } },
        { name: { contains: search } },
        // { name: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [players, total] = await Promise.all([
      prisma.player.findMany({
        where,
        select: {
          id: true,
          phone: true,
          name: true,
          playCount: true,
          totalWins: true,
          lastPlayAt: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.player.count({ where }),
    ]);

    return {
      players,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get player detail with vouchers and play history (Admin)
   */
  async getPlayerDetail(id: number) {
    const player = await prisma.player.findUnique({
      where: { id },
      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
        playCount: true,
        totalWins: true,
        lastPlayAt: true,
        createdAt: true,
      },
    });

    if (!player) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        'Không tìm thấy người chơi',
        404
      );
    }

    // Get player's vouchers
    const vouchers = await prisma.voucher.findMany({
      where: { playerId: id },
      select: {
        id: true,
        code: true,
        status: true,
        expiresAt: true,
        usedAt: true,
        createdAt: true,
        reward: {
          select: {
            id: true,
            name: true,
            value: true,
            iconUrl: true,
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to recent 50 vouchers
    });

    // Get play history
    const playHistory = await prisma.playLog.findMany({
      where: { playerId: id },
      select: {
        id: true,
        gameType: true,
        isWin: true,
        playedAt: true,
        reward: {
          select: {
            id: true,
            name: true,
            value: true,
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        playedAt: 'desc',
      },
      take: 50, // Limit to recent 50 plays
    });

    return {
      player,
      vouchers,
      playHistory,
    };
  }
}

// Export singleton instance
export const playerService = new PlayerService();
export default playerService;
