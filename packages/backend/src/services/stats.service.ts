// src/services/stats.service.ts
// Business logic for statistics aggregation and reporting

import prisma from '../config/database';
import { NotFoundError } from '../middlewares/error.middleware';
import type { PlaysQueryInput } from '../validators/stats.validator';

/**
 * StatsService
 * Handles all statistics calculations and aggregations
 */
export class StatsService {
  /**
   * Get dashboard overview statistics
   * Returns today's stats, active campaign stats, and reward breakdown
   */
  async getDashboard() {
    // Get active campaign
    const activeCampaign = await prisma.campaign.findFirst({
      where: {
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
      include: {
        rewards: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            totalQuantity: true,
            remainingQty: true,
          },
        },
      },
    });

    if (!activeCampaign) {
      throw new NotFoundError('Không có chiến dịch đang hoạt động');
    }

    // Today stats - from 00:00:00 to 23:59:59
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      todayPlays,
      todayWins,
      newPlayersToday,
      vouchersIssuedToday,
      vouchersRedeemedToday,
    ] = await Promise.all([
      // Total plays today
      prisma.playLog.count({
        where: {
          campaignId: activeCampaign.id,
          playedAt: { gte: todayStart, lte: todayEnd },
        },
      }),
      // Total wins today
      prisma.playLog.count({
        where: {
          campaignId: activeCampaign.id,
          isWin: true,
          playedAt: { gte: todayStart, lte: todayEnd },
        },
      }),
      // New players registered today
      prisma.player.count({
        where: {
          createdAt: { gte: todayStart, lte: todayEnd },
        },
      }),
      // Vouchers issued today
      prisma.voucher.count({
        where: {
          campaignId: activeCampaign.id,
          createdAt: { gte: todayStart, lte: todayEnd },
        },
      }),
      // Vouchers redeemed today
      prisma.voucher.count({
        where: {
          campaignId: activeCampaign.id,
          status: 'used',
          usedAt: { gte: todayStart, lte: todayEnd },
        },
      }),
    ]);

    const todayWinRate = todayPlays > 0 
      ? `${((todayWins / todayPlays) * 100).toFixed(1)}%` 
      : '0%';

    // Campaign stats (all time)
    const [
      totalPlays,
      totalWins,
      totalPlayers,
      totalVouchersIssued,
      totalVouchersRedeemed,
    ] = await Promise.all([
      prisma.playLog.count({
        where: { campaignId: activeCampaign.id },
      }),
      prisma.playLog.count({
        where: { campaignId: activeCampaign.id, isWin: true },
      }),
      prisma.playLog.findMany({
        where: { campaignId: activeCampaign.id },
        select: { playerId: true },
        distinct: ['playerId'],
      }),
      prisma.voucher.count({
        where: { campaignId: activeCampaign.id },
      }),
      prisma.voucher.count({
        where: { campaignId: activeCampaign.id, status: 'used' },
      }),
    ]);

    const campaignWinRate = totalPlays > 0 
      ? `${((totalWins / totalPlays) * 100).toFixed(1)}%` 
      : '0%';

    // Calculate days remaining
    const now = new Date();
    const endDate = new Date(activeCampaign.endDate);
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Reward stats
    const rewardStats = await Promise.all(
      activeCampaign.rewards.map(async (reward) => {
        const issued = await prisma.voucher.count({
          where: { rewardId: reward.id, campaignId: activeCampaign.id },
        });
        const redeemed = await prisma.voucher.count({
          where: { rewardId: reward.id, status: 'used', campaignId: activeCampaign.id },
        });
        const redeemRate = issued > 0 
          ? `${((redeemed / issued) * 100).toFixed(1)}%` 
          : '0%';

        return {
          id: reward.id,
          name: reward.name,
          issued,
          redeemed,
          remaining: reward.remainingQty ?? 0,
          redeemRate,
        };
      })
    );

    return {
      today: {
        plays: todayPlays,
        wins: todayWins,
        newPlayers: newPlayersToday,
        vouchersIssued: vouchersIssuedToday,
        vouchersRedeemed: vouchersRedeemedToday,
        winRate: todayWinRate,
      },
      campaign: {
        id: activeCampaign.id,
        name: activeCampaign.name,
        daysRemaining,
        totalPlays,
        totalWins,
        totalPlayers: totalPlayers.length,
        vouchersIssued: totalVouchersIssued,
        vouchersRedeemed: totalVouchersRedeemed,
        winRate: campaignWinRate,
      },
      rewardStats,
    };
  }

  /**
   * Get play statistics with date range and grouping
   */
  async getPlays(query: PlaysQueryInput) {
    // Get active campaign
    const activeCampaign = await prisma.campaign.findFirst({
      where: {
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    });

    if (!activeCampaign) {
      throw new NotFoundError('Không có chiến dịch đang hoạt động');
    }

    // Set default date range if not provided
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate 
      ? new Date(query.startDate) 
      : new Date(activeCampaign.startDate);

    // Set time to start/end of day
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Get all play logs in date range
    const playLogs = await prisma.playLog.findMany({
      where: {
        campaignId: activeCampaign.id,
        playedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        playedAt: true,
        isWin: true,
      },
      orderBy: {
        playedAt: 'asc',
      },
    });

    const totalPlays = playLogs.length;
    const totalWins = playLogs.filter((log) => log.isWin).length;
    const winRate = totalPlays > 0 
      ? `${((totalWins / totalPlays) * 100).toFixed(1)}%` 
      : '0%';

    // Group by date
    const chartData = this.groupPlaysByDate(playLogs, query.groupBy || 'day');

    return {
      summary: {
        totalPlays,
        totalWins,
        winRate,
      },
      chart: chartData,
    };
  }

  /**
   * Get voucher statistics
   */
  async getVouchers() {
    // Get active campaign
    const activeCampaign = await prisma.campaign.findFirst({
      where: {
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
      include: {
        rewards: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!activeCampaign) {
      throw new NotFoundError('Không có chiến dịch đang hoạt động');
    }

    // Get voucher counts by status
    const [active, used, expired, cancelled] = await Promise.all([
      prisma.voucher.count({
        where: { campaignId: activeCampaign.id, status: 'active' },
      }),
      prisma.voucher.count({
        where: { campaignId: activeCampaign.id, status: 'used' },
      }),
      prisma.voucher.count({
        where: { campaignId: activeCampaign.id, status: 'expired' },
      }),
      prisma.voucher.count({
        where: { campaignId: activeCampaign.id, status: 'cancelled' },
      }),
    ]);

    // Stats by reward
    const byReward = await Promise.all(
      activeCampaign.rewards.map(async (reward) => {
        const total = await prisma.voucher.count({
          where: { rewardId: reward.id, campaignId: activeCampaign.id },
        });
        const used = await prisma.voucher.count({
          where: { rewardId: reward.id, status: 'used', campaignId: activeCampaign.id },
        });

        return {
          rewardId: reward.id,
          rewardName: reward.name,
          total,
          used,
        };
      })
    );

    return {
      byStatus: {
        active,
        used,
        expired,
        cancelled,
      },
      byReward,
    };
  }

  /**
   * Helper: Group play logs by date with different granularity
   */
  private groupPlaysByDate(
    playLogs: Array<{ playedAt: Date; isWin: boolean }>,
    groupBy: 'day' | 'week' | 'month'
  ) {
    const grouped = new Map<string, { plays: number; wins: number }>();

    playLogs.forEach((log) => {
      const date = new Date(log.playedAt);
      let key: string;

      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (groupBy === 'week') {
        // Get Monday of the week
        const monday = new Date(date);
        const day = monday.getDay();
        const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
        monday.setDate(diff);
        key = monday.toISOString().split('T')[0];
      } else {
        // month
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
      }

      if (!grouped.has(key)) {
        grouped.set(key, { plays: 0, wins: 0 });
      }

      const stats = grouped.get(key)!;
      stats.plays++;
      if (log.isWin) {
        stats.wins++;
      }
    });

    return Array.from(grouped.entries())
      .map(([date, stats]) => ({
        date,
        plays: stats.plays,
        wins: stats.wins,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
