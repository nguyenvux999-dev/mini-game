// src/services/voucher.service.ts
// Service layer for Voucher API - handles voucher lookup, verify, redeem, cancel

import prisma from '../config/database';
import { AppError, NotFoundError } from '../middlewares/error.middleware';
import { ERROR_CODES } from '../types/api.types';
import {
  ListVouchersQuery,
  PlayerVouchersQuery,
} from '../validators/voucher.validator';

// ============================================================================
// TYPES
// ============================================================================

interface VoucherDetailResponse {
  voucher: {
    id: number;
    code: string;
    status: string;
    reward: {
      id: number;
      name: string;
      description: string | null;
      icon: string | null;
      value: number;
    };
    campaign: {
      name: string;
    };
    expiresAt: Date | null;
    createdAt: Date;
  };
  store: {
    name: string;
    address: string | null;
    hotline: string | null;
  };
}

interface VerifyVoucherResponse {
  isValid: boolean;
  voucher: Record<string, any>;
  canRedeem?: boolean;
  reason?: string;
  message?: string;
}

interface RedeemVoucherResponse {
  voucher: {
    id: number;
    code: string;
    status: string;
    usedAt: Date | null;
    usedBy: string | null;
  };
}

interface VoucherListItem {
  id: number;
  code: string;
  status: string;
  reward: {
    id: number;
    name: string;
    value: number;
  };
  player: {
    id: number;
    phone: string;
    name: string | null;
  };
  campaign: {
    id: number;
    name: string;
  };
  expiresAt: Date | null;
  createdAt: Date;
}

// ============================================================================
// SERVICE
// ============================================================================

export class VoucherService {
  // --------------------------------------------------------------------------
  // Public: Get voucher by code
  // --------------------------------------------------------------------------

  /**
   * GET /api/vouchers/:code
   * Public endpoint - get voucher detail for voucher page
   */
  async getVoucherByCode(code: string): Promise<VoucherDetailResponse> {
    const voucher = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        reward: true,
        campaign: true,
      },
    });

    if (!voucher) {
      throw new AppError(
        ERROR_CODES.VOUCHER_NOT_FOUND,
        'Không tìm thấy voucher',
        404
      );
    }

    // Auto-expire check
    if (
      voucher.status === 'active' &&
      voucher.expiresAt &&
      new Date() > voucher.expiresAt
    ) {
      await prisma.voucher.update({
        where: { id: voucher.id },
        data: { status: 'expired' },
      });
      voucher.status = 'expired';
    }

    // Get store info
    const storeConfig = await prisma.storeConfig.findFirst();

    return {
      voucher: {
        id: voucher.id,
        code: voucher.code,
        status: voucher.status,
        reward: {
          id: voucher.reward.id,
          name: voucher.reward.name,
          description: voucher.reward.description,
          icon: voucher.reward.iconUrl,
          value: voucher.reward.value,
        },
        campaign: {
          name: voucher.campaign.name,
        },
        expiresAt: voucher.expiresAt,
        createdAt: voucher.createdAt,
      },
      store: {
        name: storeConfig?.storeName || '',
        address: storeConfig?.address || null,
        hotline: storeConfig?.hotline || null,
      },
    };
  }

  // --------------------------------------------------------------------------
  // Admin: Verify voucher (for scanner)
  // --------------------------------------------------------------------------

  /**
   * GET /api/vouchers/:code/verify
   * Admin endpoint - verify voucher validity for scanner
   */
  async verifyVoucher(code: string): Promise<VerifyVoucherResponse> {
    const voucher = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        reward: true,
        player: true,
        campaign: { select: { id: true, name: true } },
      },
    });

    if (!voucher) {
      throw new AppError(
        ERROR_CODES.VOUCHER_NOT_FOUND,
        'Không tìm thấy voucher',
        404
      );
    }

    // Auto-expire check
    if (
      voucher.status === 'active' &&
      voucher.expiresAt &&
      new Date() > voucher.expiresAt
    ) {
      await prisma.voucher.update({
        where: { id: voucher.id },
        data: { status: 'expired' },
      });
      voucher.status = 'expired';
    }

    // Build response based on status
    const baseVoucher = {
      id: voucher.id,
      code: voucher.code,
      status: voucher.status,
      createdAt: voucher.createdAt,
      campaign: voucher.campaign,
    };

    if (voucher.status === 'active') {
      return {
        isValid: true,
        message: 'Voucher hợp lệ, có thể sử dụng',
        voucher: {
          ...baseVoucher,
          reward: {
            name: voucher.reward.name,
            value: voucher.reward.value,
          },
          player: {
            phone: voucher.player.phone,
            name: voucher.player.name,
          },
          expiresAt: voucher.expiresAt,
        },
        canRedeem: true,
      };
    }

    // Invalid states
    const reasonMap: Record<string, { reason: string; message: string }> = {
      used: {
        reason: 'VOUCHER_USED',
        message: 'Voucher này đã được sử dụng',
      },
      expired: {
        reason: 'VOUCHER_EXPIRED',
        message: 'Voucher này đã hết hạn',
      },
      cancelled: {
        reason: 'VOUCHER_CANCELLED',
        message: 'Voucher này đã bị huỷ',
      },
    };

    const info = reasonMap[voucher.status] || {
      reason: 'UNKNOWN',
      message: 'Voucher không hợp lệ',
    };

    return {
      isValid: false,
      reason: info.reason,
      message: info.message,
      voucher: {
        ...baseVoucher,
        reward: {
          name: voucher.reward.name,
          value: voucher.reward.value,
        },
        player: {
          phone: voucher.player.phone,
          name: voucher.player.name,
        },
        expiresAt: voucher.expiresAt,
        ...(voucher.status === 'used' && {
          usedAt: voucher.usedAt,
          usedBy: voucher.usedBy,
        }),
      },
    };
  }

  // --------------------------------------------------------------------------
  // Admin: Redeem voucher
  // --------------------------------------------------------------------------

  /**
   * POST /api/vouchers/:code/redeem
   * Admin endpoint - mark voucher as used
   */
  async redeemVoucher(
    code: string,
    adminUsername: string,
    notes?: string
  ): Promise<RedeemVoucherResponse> {
    const voucher = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!voucher) {
      throw new AppError(
        ERROR_CODES.VOUCHER_NOT_FOUND,
        'Không tìm thấy voucher',
        404
      );
    }

    // Validate status
    if (voucher.status === 'used') {
      throw new AppError(
        ERROR_CODES.VOUCHER_USED,
        'Voucher này đã được sử dụng',
        400
      );
    }

    if (voucher.status === 'cancelled') {
      throw new AppError(
        ERROR_CODES.VOUCHER_CANCELLED,
        'Voucher này đã bị huỷ',
        400
      );
    }

    // Check expiration
    if (voucher.expiresAt && new Date() > voucher.expiresAt) {
      // Auto-expire if not already
      if (voucher.status !== 'expired') {
        await prisma.voucher.update({
          where: { id: voucher.id },
          data: { status: 'expired' },
        });
      }
      throw new AppError(
        ERROR_CODES.VOUCHER_EXPIRED,
        'Voucher này đã hết hạn',
        400
      );
    }

    // Mark as used
    const updatedVoucher = await prisma.voucher.update({
      where: { id: voucher.id },
      data: {
        status: 'used',
        usedAt: new Date(),
        usedBy: adminUsername,
        notes: notes || voucher.notes,
      },
    });

    return {
      voucher: {
        id: updatedVoucher.id,
        code: updatedVoucher.code,
        status: updatedVoucher.status,
        usedAt: updatedVoucher.usedAt,
        usedBy: updatedVoucher.usedBy,
      },
    };
  }

  // --------------------------------------------------------------------------
  // Admin: List vouchers with pagination & filters
  // --------------------------------------------------------------------------

  /**
   * GET /api/vouchers
   * Admin endpoint - list all vouchers with pagination
   */
  async listVouchers(query: ListVouchersQuery) {
    const { page, limit, status, campaignId, search } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (campaignId) {
      where.campaignId = campaignId;
    }

    if (search) {
      where.OR = [
        { code: { contains: search.toUpperCase() } },
        { player: { phone: { contains: search } } },
        { player: { name: { contains: search } } },
      ];
    }

    // Query with pagination
    const [vouchers, total] = await Promise.all([
      prisma.voucher.findMany({
        where,
        include: {
          reward: {
            select: { id: true, name: true, value: true },
          },
          player: {
            select: { id: true, phone: true, name: true },
          },
          campaign: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.voucher.count({ where }),
    ]);

    // Mask phone numbers for privacy
    const maskedVouchers = vouchers.map((v) => ({
      id: v.id,
      code: v.code,
      status: v.status,
      reward: v.reward,
      player: {
        id: v.player.id,
        phone: maskPhone(v.player.phone),
        name: v.player.name,
      },
      campaign: v.campaign,
      expiresAt: v.expiresAt,
      createdAt: v.createdAt,
    }));

    return {
      vouchers: maskedVouchers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // --------------------------------------------------------------------------
  // Admin: Cancel voucher
  // --------------------------------------------------------------------------

  /**
   * PATCH /api/vouchers/:id/cancel
   * Admin endpoint - cancel a voucher
   */
  async cancelVoucher(id: number, reason?: string) {
    const voucher = await prisma.voucher.findUnique({
      where: { id },
    });

    if (!voucher) {
      throw new NotFoundError('Không tìm thấy voucher');
    }

    if (voucher.status === 'used') {
      throw new AppError(
        ERROR_CODES.VOUCHER_USED,
        'Không thể huỷ voucher đã sử dụng',
        400
      );
    }

    if (voucher.status === 'cancelled') {
      throw new AppError(
        ERROR_CODES.VOUCHER_CANCELLED,
        'Voucher đã bị huỷ trước đó',
        400
      );
    }

    // Cancel and restore reward quantity
    const updatedVoucher = await prisma.$transaction(async (tx) => {
      // Restore remaining qty if reward has limited quantity
      const reward = await tx.reward.findUnique({
        where: { id: voucher.rewardId },
      });

      if (reward && reward.totalQuantity !== null && reward.remainingQty !== null) {
        await tx.reward.update({
          where: { id: reward.id },
          data: { remainingQty: { increment: 1 } },
        });
      }

      // Update voucher status
      return tx.voucher.update({
        where: { id: voucher.id },
        data: {
          status: 'cancelled',
          notes: reason
            ? `${voucher.notes ? voucher.notes + ' | ' : ''}Huỷ: ${reason}`
            : voucher.notes,
        },
      });
    });

    return {
      voucher: {
        id: updatedVoucher.id,
        code: updatedVoucher.code,
        status: updatedVoucher.status,
      },
    };
  }

  // --------------------------------------------------------------------------
  // Player: Get my vouchers
  // --------------------------------------------------------------------------

  /**
   * GET /api/players/:id/vouchers
   * Player endpoint - list player's own vouchers
   */
  async getPlayerVouchers(playerId: number, query: PlayerVouchersQuery) {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const where: any = { playerId };

    if (status && status !== 'all') {
      where.status = status;
    }

    const [vouchers, total] = await Promise.all([
      prisma.voucher.findMany({
        where,
        include: {
          reward: {
            select: {
              id: true,
              name: true,
              description: true,
              iconUrl: true,
              value: true,
            },
          },
          campaign: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.voucher.count({ where }),
    ]);

    // Auto-expire active vouchers that are past expiration
    const now = new Date();
    const processedVouchers = vouchers.map((v) => {
      let status = v.status;
      if (status === 'active' && v.expiresAt && now > v.expiresAt) {
        status = 'expired';
        // Fire-and-forget update
        prisma.voucher
          .update({ where: { id: v.id }, data: { status: 'expired' } })
          .catch(() => {});
      }

      return {
        id: v.id,
        code: v.code,
        qrData: v.qrData,
        status,
        reward: {
          id: v.reward.id,
          name: v.reward.name,
          description: v.reward.description,
          icon: v.reward.iconUrl,
          value: v.reward.value,
        },
        campaign: v.campaign,
        expiresAt: v.expiresAt,
        createdAt: v.createdAt,
      };
    });

    return {
      vouchers: processedVouchers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Mask phone number for privacy: 0909123456 -> 0909***456
 */
function maskPhone(phone: string): string {
  if (phone.length <= 6) return phone;
  const start = phone.slice(0, 4);
  const end = phone.slice(-3);
  return `${start}***${end}`;
}

// Singleton export
export const voucherService = new VoucherService();
