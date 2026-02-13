// src/services/reward.service.ts
// Service layer for Reward API - handles reward CRUD and management

import prisma from '../config/database';
import { AppError, NotFoundError } from '../middlewares/error.middleware';
import { ERROR_CODES } from '../types/api.types';
import {
  ListRewardsQuery,
  CreateRewardInput,
  UpdateRewardInput,
} from '../validators/reward.validator';

// ============================================================================
// TYPES
// ============================================================================

interface RewardListItem {
  id: number;
  campaignId: number;
  name: string;
  description: string | null;
  iconUrl: string | null;
  probability: number;
  totalQuantity: number | null;
  remainingQty: number | null;
  value: number;
  isActive: boolean;
  displayOrder: number;
}

interface RewardDetail {
  id: number;
  campaignId: number;
  name: string;
  description: string | null;
  iconUrl: string | null;
  probability: number;
  totalQuantity: number | null;
  remainingQty: number | null;
  value: number;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  campaign: {
    id: number;
    name: string;
  };
}

// ============================================================================
// SERVICE
// ============================================================================

export class RewardService {
  // --------------------------------------------------------------------------
  // List rewards with optional campaign filter
  // --------------------------------------------------------------------------

  /**
   * GET /api/rewards
   * Admin: List all rewards, optionally filtered by campaign
   */
  async listRewards(query: ListRewardsQuery) {
    const { campaignId } = query;

    // Build where clause
    const where: any = {};
    if (campaignId) {
      where.campaignId = campaignId;
    }

    // Query rewards
    const rewards = await prisma.reward.findMany({
      where,
      orderBy: [{ campaignId: 'desc' }, { displayOrder: 'asc' }],
    });

    // Map to response format
    const rewardList: RewardListItem[] = rewards.map((reward) => ({
      id: reward.id,
      campaignId: reward.campaignId,
      name: reward.name,
      description: reward.description,
      iconUrl: reward.iconUrl,
      probability: reward.probability,
      totalQuantity: reward.totalQuantity,
      remainingQty: reward.remainingQty,
      value: reward.value,
      isActive: reward.isActive,
      displayOrder: reward.displayOrder,
    }));

    return { rewards: rewardList };
  }

  // --------------------------------------------------------------------------
  // Get reward detail by ID
  // --------------------------------------------------------------------------

  /**
   * GET /api/rewards/:id
   * Admin: Get reward detail with campaign info
   */
  async getRewardById(id: number): Promise<RewardDetail> {
    const reward = await prisma.reward.findUnique({
      where: { id },
      include: {
        campaign: {
          select: { id: true, name: true },
        },
      },
    });

    if (!reward) {
      throw new NotFoundError('Không tìm thấy phần thưởng');
    }

    return {
      id: reward.id,
      campaignId: reward.campaignId,
      name: reward.name,
      description: reward.description,
      iconUrl: reward.iconUrl,
      probability: reward.probability,
      totalQuantity: reward.totalQuantity,
      remainingQty: reward.remainingQty,
      value: reward.value,
      isActive: reward.isActive,
      displayOrder: reward.displayOrder,
      createdAt: reward.createdAt,
      campaign: reward.campaign,
    };
  }

  // --------------------------------------------------------------------------
  // Create new reward
  // --------------------------------------------------------------------------

  /**
   * POST /api/rewards
   * Admin: Create a new reward
   */
  async createReward(input: CreateRewardInput) {
    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: input.campaignId },
    });

    if (!campaign) {
      throw new NotFoundError('Không tìm thấy chương trình');
    }

    // Validate probability sum for campaign (optional check)
    // The total probability across all rewards in a campaign should ideally be <= 100
    // But we'll allow flexibility - admin can configure as needed

    // Set remainingQty = totalQuantity initially
    const remainingQty = input.totalQuantity ?? null;

    const reward = await prisma.reward.create({
      data: {
        campaignId: input.campaignId,
        name: input.name,
        description: input.description || null,
        iconUrl: input.iconUrl || null,
        probability: input.probability,
        totalQuantity: input.totalQuantity ?? null,
        remainingQty,
        value: input.value || 0,
        isActive: input.isActive ?? true,
        displayOrder: input.displayOrder || 0,
      },
    });

    return {
      id: reward.id,
      campaignId: reward.campaignId,
      name: reward.name,
      description: reward.description,
      iconUrl: reward.iconUrl,
      probability: reward.probability,
      totalQuantity: reward.totalQuantity,
      remainingQty: reward.remainingQty,
      value: reward.value,
      isActive: reward.isActive,
      displayOrder: reward.displayOrder,
      createdAt: reward.createdAt,
    };
  }

  // --------------------------------------------------------------------------
  // Update reward
  // --------------------------------------------------------------------------

  /**
   * PUT /api/rewards/:id
   * Admin: Update reward (partial update)
   */
  async updateReward(id: number, input: UpdateRewardInput) {
    // Check if reward exists
    const existing = await prisma.reward.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Không tìm thấy phần thưởng');
    }

    // Build update data
    const updateData: any = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined)
      updateData.description = input.description;
    if (input.iconUrl !== undefined) updateData.iconUrl = input.iconUrl;
    if (input.probability !== undefined)
      updateData.probability = input.probability;
    if (input.value !== undefined) updateData.value = input.value;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;
    if (input.displayOrder !== undefined)
      updateData.displayOrder = input.displayOrder;

    // Handle totalQuantity update - also update remainingQty if needed
    if (input.totalQuantity !== undefined) {
      updateData.totalQuantity = input.totalQuantity;
      // If increasing quantity, also increase remainingQty
      if (input.totalQuantity !== null && existing.totalQuantity !== null) {
        const diff = input.totalQuantity - existing.totalQuantity;
        if (diff > 0) {
          updateData.remainingQty = (existing.remainingQty || 0) + diff;
        }
      } else if (input.totalQuantity !== null && existing.totalQuantity === null) {
        // Was unlimited, now limited - set remainingQty to totalQuantity
        updateData.remainingQty = input.totalQuantity;
      } else if (input.totalQuantity === null) {
        // Becoming unlimited - set remainingQty to null
        updateData.remainingQty = null;
      }
    }

    const reward = await prisma.reward.update({
      where: { id },
      data: updateData,
    });

    return {
      id: reward.id,
      campaignId: reward.campaignId,
      name: reward.name,
      description: reward.description,
      iconUrl: reward.iconUrl,
      probability: reward.probability,
      totalQuantity: reward.totalQuantity,
      remainingQty: reward.remainingQty,
      value: reward.value,
      isActive: reward.isActive,
      displayOrder: reward.displayOrder,
    };
  }

  // --------------------------------------------------------------------------
  // Delete reward
  // --------------------------------------------------------------------------

  /**
   * DELETE /api/rewards/:id
   * Admin: Delete reward
   */
  async deleteReward(id: number) {
    const reward = await prisma.reward.findUnique({ where: { id } });
    if (!reward) {
      throw new NotFoundError('Không tìm thấy phần thưởng');
    }

    // Check if reward has active vouchers
    const activeVouchersCount = await prisma.voucher.count({
      where: {
        rewardId: id,
        status: 'active',
      },
    });

    if (activeVouchersCount > 0) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        `Không thể xoá phần thưởng có ${activeVouchersCount} voucher đang hoạt động. Vui lòng huỷ hoặc đợi voucher hết hạn trước.`,
        400
      );
    }

    // Delete reward (cascade will handle relations)
    await prisma.reward.delete({ where: { id } });

    return { id };
  }

  // --------------------------------------------------------------------------
  // Toggle reward active status
  // --------------------------------------------------------------------------

  /**
   * PATCH /api/rewards/:id/toggle
   * Admin: Toggle reward isActive status
   */
  async toggleReward(id: number) {
    const reward = await prisma.reward.findUnique({ where: { id } });
    if (!reward) {
      throw new NotFoundError('Không tìm thấy phần thưởng');
    }

    const updated = await prisma.reward.update({
      where: { id },
      data: { isActive: !reward.isActive },
    });

    return {
      id: updated.id,
      isActive: updated.isActive,
    };
  }
}

// Singleton export
export const rewardService = new RewardService();
