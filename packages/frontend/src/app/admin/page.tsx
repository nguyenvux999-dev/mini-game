// src/app/admin/page.tsx
// Admin Dashboard — Stats overview, play chart, recent vouchers
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { PageHeader, StatsCard } from '@/components/admin';
import PlayChart from '@/components/admin/PlayChart';
import RecentVouchers from '@/components/admin/RecentVouchers';
import { Loading } from '@/components/common';
import { swrFetcher } from '@/lib/api';
import { voucherApi } from '@/lib/api';
import { SWR_KEYS } from '@/lib/constants';
import type { DashboardStats, PlayStatsResponse, VoucherWithRelations, PaginationMeta } from '@/types/api.types';

type DateRange = '7d' | '30d' | '90d';

function getDateRange(range: DateRange): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  switch (range) {
    case '7d':
      start.setDate(end.getDate() - 7);
      break;
    case '30d':
      start.setDate(end.getDate() - 30);
      break;
    case '90d':
      start.setDate(end.getDate() - 90);
      break;
  }
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<DateRange>('7d');

  const { startDate, endDate } = useMemo(() => getDateRange(dateRange), [dateRange]);

  // ── Fetch dashboard stats ────────────────────────────────────────────────
  const { data: stats, isLoading: statsLoading } = useSWR<DashboardStats>(
    SWR_KEYS.STATS_OVERVIEW,
    swrFetcher,
    { revalidateOnFocus: false }
  );

  // ── Fetch play chart data ────────────────────────────────────────────────
  const { data: playStats, isLoading: chartLoading } = useSWR<PlayStatsResponse>(
    `${SWR_KEYS.STATS_PLAYS}?startDate=${startDate}&endDate=${endDate}&groupBy=day`,
    swrFetcher,
    { revalidateOnFocus: false }
  );

  // ── Fetch recent vouchers ────────────────────────────────────────────────
  const { data: vouchersData, isLoading: vouchersLoading, mutate: mutateVouchers } = useSWR<{
    vouchers: VoucherWithRelations[];
    pagination: PaginationMeta;
  }>(`${SWR_KEYS.VOUCHERS}?limit=10&page=1`, swrFetcher, { revalidateOnFocus: false });

  // ── Redeem handler ───────────────────────────────────────────────────────
  const handleRedeem = useCallback(
    async (code: string) => {
      if (!confirm(`Xác nhận đổi voucher ${code}?`)) return;
      try {
        await voucherApi.redeem(code);
        mutateVouchers();
      } catch {
        alert('Đổi voucher thất bại. Vui lòng thử lại.');
      }
    },
    [mutateVouchers]
  );

  if (statsLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Loading size="lg" text="Đang tải dữ liệu..." />
      </div>
    );
  }

  const campaign = stats?.campaign;
  const today = stats?.today;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page header */}
      <PageHeader
        title="Dashboard"
        description={
          campaign
            ? `Chiến dịch đang chạy: ${campaign.name}`
            : 'Chưa có chiến dịch nào đang hoạt động'
        }
      />

      {/* ── Stats Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Tổng lượt chơi"
          value={campaign?.totalPlays ?? 0}
          icon="🎮"
          trend={
            today?.plays
              ? { value: today.plays, direction: 'up' as const, label: 'hôm nay' }
              : undefined
          }
        />
        <StatsCard
          label="Tổng người chơi"
          value={campaign?.totalPlayers ?? 0}
          icon="👥"
          trend={
            today?.newPlayers
              ? { value: today.newPlayers, direction: 'up' as const, label: 'mới hôm nay' }
              : undefined
          }
          colorClass="text-blue-600 bg-blue-50"
        />
        <StatsCard
          label="Tổng trúng thưởng"
          value={campaign?.totalWins ?? 0}
          icon="🎁"
          trend={
            today?.wins
              ? { value: today.wins, direction: 'up' as const, label: 'hôm nay' }
              : undefined
          }
          colorClass="text-green-600 bg-green-50"
        />
        <StatsCard
          label="Voucher đã đổi"
          value={campaign?.vouchersRedeemed ?? 0}
          icon="🎟️"
          trend={
            today?.vouchersRedeemed
              ? { value: today.vouchersRedeemed, direction: 'up' as const, label: 'hôm nay' }
              : undefined
          }
          colorClass="text-purple-600 bg-purple-50"
        />
      </div>

      {/* ── Play Statistics Chart ───────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-gray-900">Thống kê lượt chơi</h3>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            {(['7d', '30d', '90d'] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  dateRange === range
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {range === '7d' ? '7 ngày' : range === '30d' ? '30 ngày' : '90 ngày'}
              </button>
            ))}
          </div>
        </div>
        <div className="p-5">
          {chartLoading ? (
            <div className="flex items-center justify-center h-[300px]">
              <Loading size="md" text="Đang tải biểu đồ..." />
            </div>
          ) : (
            <PlayChart data={playStats?.chart || []} />
          )}
        </div>
      </div>

      {/* ── Quick Info Row ──────────────────────────────────────────────── */}
      {campaign && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-orange-900">
              🔥 Chiến dịch: {campaign.name}
            </p>
            <p className="text-xs text-orange-700 mt-0.5">
              {campaign.daysRemaining > 0
                ? `Còn ${campaign.daysRemaining} ngày`
                : campaign.daysRemaining === 0
                ? 'Kết thúc hôm nay'
                : 'Đã kết thúc'}
              {' · '}
              Tỉ lệ thắng: {campaign.winRate}
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/campaigns')}
            className="text-xs font-medium text-orange-700 hover:text-orange-800 whitespace-nowrap"
          >
            Xem chi tiết →
          </button>
        </div>
      )}

      {/* ── Recent Vouchers ─────────────────────────────────────────────── */}
      <RecentVouchers
        vouchers={vouchersData?.vouchers ?? []}
        loading={vouchersLoading}
        onRedeem={handleRedeem}
      />
    </div>
  );
}
