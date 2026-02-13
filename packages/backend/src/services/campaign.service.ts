// src/services/campaign.service.ts
// Service layer for Campaign API - handles campaign CRUD and management

import prisma from '../config/database';
import { AppError, NotFoundError } from '../middlewares/error.middleware';
import { ERROR_CODES } from '../types/api.types';
import {
  ListCampaignsQuery,
  CreateCampaignInput,
  UpdateCampaignInput,
} from '../validators/campaign.validator';

// ============================================================================
// TYPES
// ============================================================================

interface CampaignListItem {
  id: number;
  name: string;
  activeGame: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  stats: {
    totalPlays: number;
    totalWins: number;
    vouchersIssued: number;
    vouchersRedeemed: number;
  };
}

interface CampaignDetail {
  id: number;
  name: string;
  description: string | null;
  activeGame: string;
  gameConfig: any;
  startDate: Date;
  endDate: Date;
  maxPlaysPerPhone: number;
  isActive: boolean;
  rewards: Array<{
    id: number;
    name: string;
    probability: number;
    totalQuantity: number | null;
    remainingQty: number | null;
    isActive: boolean;
  }>;
  stats: {
    totalPlays: number;
    totalWins: number;
  };
}

// ============================================================================
// SERVICE
// ============================================================================

export class CampaignService {
  // --------------------------------------------------------------------------
  // List campaigns with pagination & filters
  // --------------------------------------------------------------------------

  /**
   * GET /api/campaigns
   * Admin: List all campaigns with pagination and stats
   */
  async listCampaigns(query: ListCampaignsQuery) {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;
    const now = new Date();

    // Build where clause based on status filter
    const where: any = {};

    if (status === 'active') {
      where.isActive = true;
      where.startDate = { lte: now };
      where.endDate = { gte: now };
    } else if (status === 'ended') {
      where.OR = [
        { isActive: false },
        { endDate: { lt: now } },
      ];
    }
    // 'all' means no filter

    // Query campaigns with pagination
    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.campaign.count({ where }),
    ]);

    // Fetch stats for each campaign
    const campaignsWithStats: CampaignListItem[] = await Promise.all(
      campaigns.map(async (campaign) => {
        const [totalPlays, totalWins, vouchersIssued, vouchersRedeemed] =
          await Promise.all([
            prisma.playLog.count({ where: { campaignId: campaign.id } }),
            prisma.playLog.count({
              where: { campaignId: campaign.id, isWin: true },
            }),
            prisma.voucher.count({ where: { campaignId: campaign.id } }),
            prisma.voucher.count({
              where: { campaignId: campaign.id, status: 'used' },
            }),
          ]);

        return {
          id: campaign.id,
          name: campaign.name,
          activeGame: campaign.activeGame,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          isActive: campaign.isActive,
          stats: {
            totalPlays,
            totalWins,
            vouchersIssued,
            vouchersRedeemed,
          },
        };
      })
    );

    return {
      campaigns: campaignsWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // --------------------------------------------------------------------------
  // Get campaign detail by ID
  // --------------------------------------------------------------------------

  /**
   * GET /api/campaigns/:id
   * Admin: Get campaign detail with rewards and stats
   */
  async getCampaignById(id: number): Promise<CampaignDetail> {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        rewards: {
          select: {
            id: true,
            name: true,
            probability: true,
            totalQuantity: true,
            remainingQty: true,
            isActive: true,
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundError('Không tìm thấy chương trình');
    }

    // Fetch stats
    const [totalPlays, totalWins] = await Promise.all([
      prisma.playLog.count({ where: { campaignId: campaign.id } }),
      prisma.playLog.count({
        where: { campaignId: campaign.id, isWin: true },
      }),
    ]);

    // Parse gameConfig if it's a JSON string
    let gameConfig: any = null;
    if (campaign.gameConfig) {
      try {
        gameConfig = JSON.parse(campaign.gameConfig);
      } catch {
        gameConfig = campaign.gameConfig;
      }
    }

    return {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      activeGame: campaign.activeGame,
      gameConfig,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      maxPlaysPerPhone: campaign.maxPlaysPerPhone,
      isActive: campaign.isActive,
      rewards: campaign.rewards,
      stats: {
        totalPlays,
        totalWins,
      },
    };
  }

  // --------------------------------------------------------------------------
  // Create new campaign
  // --------------------------------------------------------------------------

  /**
   * POST /api/campaigns
   * Admin: Create a new campaign
   */
  async createCampaign(input: CreateCampaignInput) {
    // Validate date range
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);

    if (endDate <= startDate) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        'Ngày kết thúc phải sau ngày bắt đầu',
        400
      );
    }

    // Convert gameConfig to JSON string if it's an object
    const gameConfigStr = input.gameConfig
      ? JSON.stringify(input.gameConfig)
      : null;

    const campaign = await prisma.campaign.create({
      data: {
        name: input.name,
        description: input.description || null,
        startDate,
        endDate,
        activeGame: input.activeGame,
        gameConfig: gameConfigStr,
        maxPlaysPerPhone: input.maxPlaysPerPhone || 1,
        isActive: input.isActive || false,
      },
    });

    // Parse gameConfig back to object for response
    let gameConfig: any = null;
    if (campaign.gameConfig) {
      try {
        gameConfig = JSON.parse(campaign.gameConfig);
      } catch {
        gameConfig = campaign.gameConfig;
      }
    }

    return {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      activeGame: campaign.activeGame,
      gameConfig,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      maxPlaysPerPhone: campaign.maxPlaysPerPhone,
      isActive: campaign.isActive,
      createdAt: campaign.createdAt,
    };
  }

  // --------------------------------------------------------------------------
  // Update campaign
  // --------------------------------------------------------------------------

  /**
   * PUT /api/campaigns/:id
   * Admin: Update campaign (partial update)
   */
  async updateCampaign(id: number, input: UpdateCampaignInput) {
    // Check if campaign exists
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Không tìm thấy chương trình');
    }

    // Validate date range if both are provided
    if (input.startDate && input.endDate) {
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);
      if (endDate <= startDate) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          'Ngày kết thúc phải sau ngày bắt đầu',
          400
        );
      }
    }

    // Build update data
    const updateData: any = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined)
      updateData.description = input.description;
    if (input.startDate !== undefined)
      updateData.startDate = new Date(input.startDate);
    if (input.endDate !== undefined)
      updateData.endDate = new Date(input.endDate);
    if (input.activeGame !== undefined)
      updateData.activeGame = input.activeGame;
    if (input.maxPlaysPerPhone !== undefined)
      updateData.maxPlaysPerPhone = input.maxPlaysPerPhone;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    // Handle gameConfig conversion
    if (input.gameConfig !== undefined) {
      updateData.gameConfig = input.gameConfig
        ? JSON.stringify(input.gameConfig)
        : null;
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data: updateData,
    });

    // Parse gameConfig back to object for response
    let gameConfig: any = null;
    if (campaign.gameConfig) {
      try {
        gameConfig = JSON.parse(campaign.gameConfig);
      } catch {
        gameConfig = campaign.gameConfig;
      }
    }

    return {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      activeGame: campaign.activeGame,
      gameConfig,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      maxPlaysPerPhone: campaign.maxPlaysPerPhone,
      isActive: campaign.isActive,
      updatedAt: campaign.updatedAt,
    };
  }

  // --------------------------------------------------------------------------
  // Delete campaign
  // --------------------------------------------------------------------------

  /**
   * DELETE /api/campaigns/:id
   * Admin: Delete campaign (cascade deletes rewards, vouchers, play logs)
   */
  async deleteCampaign(id: number) {
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      throw new NotFoundError('Không tìm thấy chương trình');
    }

    // Check if campaign has active vouchers
    const activeVouchersCount = await prisma.voucher.count({
      where: {
        campaignId: id,
        status: 'active',
      },
    });

    if (activeVouchersCount > 0) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        `Không thể xoá chương trình có ${activeVouchersCount} voucher đang hoạt động. Vui lòng huỷ hoặc đợi voucher hết hạn trước.`,
        400
      );
    }

    // Delete campaign (cascade will handle relations)
    await prisma.campaign.delete({ where: { id } });

    return { id };
  }

  // --------------------------------------------------------------------------
  // Toggle campaign active status
  // --------------------------------------------------------------------------

  /**
   * PATCH /api/campaigns/:id/toggle
   * Admin: Toggle campaign isActive status
   */
  async toggleCampaign(id: number) {
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      throw new NotFoundError('Không tìm thấy chương trình');
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: { isActive: !campaign.isActive },
    });

    return {
      id: updated.id,
      isActive: updated.isActive,
    };
  }
}

// Singleton export
export const campaignService = new CampaignService();
