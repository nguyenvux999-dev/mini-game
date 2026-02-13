// src/engines/GameEngine.ts
// Core Game Engine - Xử lý logic chơi game

import prisma from '../config/database';
import { RandomEngine } from './RandomEngine';
import { VoucherGenerator } from './VoucherGenerator';
import { AppError } from '../middlewares/error.middleware';
import { ERROR_CODES } from '../types/api.types';
import config from '../config';

/**
 * Game types supported
 */
type GameType = 'wheel' | 'shake' | 'memory' | 'tap';

/**
 * Game data from client (optional, for validation)
 */
interface GameData {
  // Memory game
  matchedPairs?: number;
  timeSpent?: number;
  // Tap game
  taps?: number;
  perfectHits?: number;
  // Shake game
  shakeCount?: number;
}

/**
 * Play result returned to client
 */
interface PlayResult {
  isWin: boolean;
  reward: {
    id: number;
    name: string;
    description: string | null;
    icon: string | null;
    value: number | null;
  } | null;
  voucher: {
    id: number;
    code: string;
    qrCode: string;
    expiresAt: Date | null;
  } | null;
  player: {
    remainingPlays: number;
    totalWins: number;
  };
}

/**
 * Eligibility check result
 */
interface EligibilityResult {
  canPlay: boolean;
  remainingPlays: number;
  maxPlays: number;
  reason?: string;
  message?: string;
}

/**
 * Game Engine
 * Core game processing logic
 */
export class GameEngine {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  /**
   * Check if player is eligible to play
   */
  async checkEligibility(
    playerId: number,
    campaignId: number
  ): Promise<EligibilityResult> {
    // Get campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return {
        canPlay: false,
        remainingPlays: 0,
        maxPlays: 0,
        reason: 'CAMPAIGN_NOT_FOUND',
        message: 'Chương trình không tồn tại',
      };
    }

    // Check if campaign is active
    const now = new Date();
    if (!campaign.isActive) {
      return {
        canPlay: false,
        remainingPlays: 0,
        maxPlays: campaign.maxPlaysPerPhone,
        reason: 'CAMPAIGN_NOT_ACTIVE',
        message: 'Chương trình chưa được kích hoạt',
      };
    }

    if (now < campaign.startDate) {
      return {
        canPlay: false,
        remainingPlays: 0,
        maxPlays: campaign.maxPlaysPerPhone,
        reason: 'CAMPAIGN_NOT_STARTED',
        message: 'Chương trình chưa bắt đầu',
      };
    }

    if (now > campaign.endDate) {
      return {
        canPlay: false,
        remainingPlays: 0,
        maxPlays: campaign.maxPlaysPerPhone,
        reason: 'CAMPAIGN_ENDED',
        message: 'Chương trình đã kết thúc',
      };
    }

    // Count player's plays in this campaign
    const playCount = await prisma.playLog.count({
      where: {
        playerId,
        campaignId,
      },
    });

    const remainingPlays = Math.max(0, campaign.maxPlaysPerPhone - playCount);

    if (remainingPlays <= 0) {
      return {
        canPlay: false,
        remainingPlays: 0,
        maxPlays: campaign.maxPlaysPerPhone,
        reason: 'NO_PLAYS_LEFT',
        message: 'Bạn đã hết lượt chơi. Cảm ơn bạn đã tham gia!',
      };
    }

    return {
      canPlay: true,
      remainingPlays,
      maxPlays: campaign.maxPlaysPerPhone,
    };
  }

  /**
   * Main play method - Process game play
   * Uses Prisma Transaction for data integrity
   */
  async play(
    playerId: number,
    campaignId: number,
    gameType: GameType,
    gameData?: GameData,
    ipAddress?: string,
    userAgent?: string
  ): Promise<PlayResult> {
    // Use transaction for data integrity
    return await prisma.$transaction(async (tx) => {
      // 1. Check eligibility
      const eligibility = await this.checkEligibilityInTransaction(
        tx,
        playerId,
        campaignId
      );

      if (!eligibility.canPlay) {
        throw new AppError(
          eligibility.reason === 'CAMPAIGN_ENDED'
            ? ERROR_CODES.CAMPAIGN_ENDED
            : eligibility.reason === 'NO_PLAYS_LEFT'
            ? ERROR_CODES.NO_PLAYS_LEFT
            : ERROR_CODES.CAMPAIGN_NOT_ACTIVE,
          eligibility.message || 'Không thể chơi game',
          400
        );
      }

      // 2. Get active rewards for this campaign
      const rewards = await tx.reward.findMany({
        where: {
          campaignId,
          isActive: true,
        },
        orderBy: { displayOrder: 'asc' },
      });

      if (rewards.length === 0) {
        throw new AppError(
          ERROR_CODES.SERVER_ERROR,
          'Chương trình chưa có phần thưởng',
          500
        );
      }

      // 3. Random reward using weighted algorithm
      const selectedReward = RandomEngine.selectWeighted(rewards);

      if (!selectedReward) {
        throw new AppError(
          ERROR_CODES.SERVER_ERROR,
          'Không thể chọn phần thưởng',
          500
        );
      }

      // 4. Determine if player wins
      // Win = reward has value > 0 (not "chúc may mắn" type)
      const isWin = selectedReward.value !== null && selectedReward.value > 0;

      let voucher = null;

      // 5. If win, create voucher
      if (isWin) {
        // Generate voucher code and QR
        const voucherData = await VoucherGenerator.generateVoucher(this.baseUrl);

        // Calculate expiry date (end of campaign or 30 days, whichever is sooner)
        const campaign = await tx.campaign.findUnique({
          where: { id: campaignId },
        });

        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

        const expiresAt = campaign && campaign.endDate < thirtyDaysLater
          ? campaign.endDate
          : thirtyDaysLater;

        // Create voucher in DB
        const createdVoucher = await tx.voucher.create({
          data: {
            playerId,
            rewardId: selectedReward.id,
            campaignId,
            code: voucherData.code,
            qrData: voucherData.qrCode, // Save base64 QR image (contains URL when scanned)
            status: 'active',
            expiresAt,
          },
        });

        voucher = {
          id: createdVoucher.id,
          code: createdVoucher.code,
          qrCode: voucherData.qrCode,
          expiresAt: createdVoucher.expiresAt,
        };

        // 6. Decrease remaining quantity
        if (selectedReward.remainingQty !== null) {
          await tx.reward.update({
            where: { id: selectedReward.id },
            data: {
              remainingQty: {
                decrement: 1,
              },
            },
          });
        }
      }

      // 7. Create play log
      await tx.playLog.create({
        data: {
          playerId,
          campaignId,
          gameType,
          rewardId: selectedReward.id,
          isWin,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
        },
      });

      // 8. Update player stats
      const updatedPlayer = await tx.player.update({
        where: { id: playerId },
        data: {
          playCount: { increment: 1 },
          totalWins: isWin ? { increment: 1 } : undefined,
          lastPlayAt: new Date(),
        },
      });

      // 9. Calculate remaining plays after this play
      const newPlayCount = await tx.playLog.count({
        where: {
          playerId,
          campaignId,
        },
      });

      const campaign = await tx.campaign.findUnique({
        where: { id: campaignId },
      });

      const remainingPlays = campaign
        ? Math.max(0, campaign.maxPlaysPerPhone - newPlayCount)
        : 0;

      // 10. Return result
      return {
        isWin,
        reward: {
          id: selectedReward.id,
          name: selectedReward.name,
          description: selectedReward.description,
          icon: selectedReward.iconUrl,
          value: selectedReward.value,
        },
        voucher,
        player: {
          remainingPlays,
          totalWins: updatedPlayer.totalWins,
        },
      };
    });
  }

  /**
   * Check eligibility within transaction context
   */
  private async checkEligibilityInTransaction(
    tx: any,
    playerId: number,
    campaignId: number
  ): Promise<EligibilityResult> {
    const campaign = await tx.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return {
        canPlay: false,
        remainingPlays: 0,
        maxPlays: 0,
        reason: 'CAMPAIGN_NOT_FOUND',
        message: 'Chương trình không tồn tại',
      };
    }

    const now = new Date();
    if (!campaign.isActive || now < campaign.startDate || now > campaign.endDate) {
      return {
        canPlay: false,
        remainingPlays: 0,
        maxPlays: campaign.maxPlaysPerPhone,
        reason: now > campaign.endDate ? 'CAMPAIGN_ENDED' : 'CAMPAIGN_NOT_ACTIVE',
        message: now > campaign.endDate
          ? 'Chương trình đã kết thúc'
          : 'Chương trình chưa hoạt động',
      };
    }

    const playCount = await tx.playLog.count({
      where: { playerId, campaignId },
    });

    const remainingPlays = Math.max(0, campaign.maxPlaysPerPhone - playCount);

    if (remainingPlays <= 0) {
      return {
        canPlay: false,
        remainingPlays: 0,
        maxPlays: campaign.maxPlaysPerPhone,
        reason: 'NO_PLAYS_LEFT',
        message: 'Bạn đã hết lượt chơi',
      };
    }

    return {
      canPlay: true,
      remainingPlays,
      maxPlays: campaign.maxPlaysPerPhone,
    };
  }

  /**
   * Get active campaign
   */
  async getActiveCampaign() {
    const now = new Date();
    return prisma.campaign.findFirst({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        rewards: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
  }
}

// Export singleton instance
export const gameEngine = new GameEngine();
export default gameEngine;
