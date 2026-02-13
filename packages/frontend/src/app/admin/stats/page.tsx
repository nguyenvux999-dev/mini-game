// src/app/admin/stats/page.tsx
// Statistics Page — Overview cards, play chart with date range/groupBy, voucher stats

'use client';

import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import PageHeader from '@/components/admin/PageHeader';
import Loading from '@/components/common/Loading';
import Badge from '@/components/common/Badge';
import { swrFetcher } from '@/lib/api';
import { SWR_KEYS } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';
import type {
  DashboardStats,
  PlayStatsResponse,
  VoucherStats,
} from '@/types/api.types';

// ── Date helpers ─────────────────────────────────────────────────────────────

function getDateRange(range: string) {
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
    default:
      start.setDate(end.getDate() - 30);
  }
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

const PIE_COLORS = ['#22c55e', '#3b82f6', '#9ca3af', '#ef4444'];

export default function StatsPage() {
  const [dateRange, setDateRange] = useState('30d');
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');

  // ── Data fetching ──────────────────────────────────────────────────────

  const { data: overview, isLoading: loadingOverview } = useSWR<DashboardStats>(
    SWR_KEYS.STATS_OVERVIEW,
    swrFetcher
  );

  const { startDate, endDate } = getDateRange(dateRange);
  const playStatsKey = `${SWR_KEYS.STATS_PLAYS}?startDate=${startDate}&endDate=${endDate}&groupBy=${groupBy}`;

  const { data: playStats, isLoading: loadingPlays } = useSWR<PlayStatsResponse>(
    playStatsKey,
    swrFetcher
  );

  const { data: voucherStats, isLoading: loadingVouchers } = useSWR<VoucherStats>(
    SWR_KEYS.STATS_VOUCHERS,
    swrFetcher
  );

  // ── Voucher pie data ───────────────────────────────────────────────────

  const pieData = useMemo(() => {
    if (!voucherStats?.byStatus) return [];
    return [
      { name: 'Chưa dùng', value: voucherStats.byStatus.active },
      { name: 'Đã dùng', value: voucherStats.byStatus.used },
      { name: 'Hết hạn', value: voucherStats.byStatus.expired },
      { name: 'Đã huỷ', value: voucherStats.byStatus.cancelled },
    ].filter((d) => d.value > 0);
  }, [voucherStats]);

  // ── Loading state ──────────────────────────────────────────────────────

  if (loadingOverview) {
    return (
      <div className="p-6">
        <Loading text="Đang tải thống kê..." />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Thống kê"
        description="Tổng quan hoạt động chiến dịch"
        breadcrumbs={[{ label: 'Thống kê' }]}
      />

      {/* ── Overview Cards ──────────────────────────────────────────────── */}
      {overview && (
        <div className="space-y-4">
          {/* Today stats */}
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Hôm nay
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard label="Lượt chơi" value={overview.today.plays} color="orange" />
            <StatCard label="Trúng thưởng" value={overview.today.wins} color="green" />
            <StatCard label="Người mới" value={overview.today.newPlayers} color="blue" />
            <StatCard label="Voucher phát" value={overview.today.vouchersIssued} color="purple" />
            <StatCard label="Voucher dùng" value={overview.today.vouchersRedeemed} color="teal" />
            <StatCard label="Tỉ lệ trúng" value={overview.today.winRate} color="amber" isText />
          </div>

          {/* Campaign stats */}
          {overview.campaign && (
            <>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider pt-2">
                Chiến dịch: {overview.campaign.name}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <StatCard label="Còn lại" value={`${overview.campaign.daysRemaining} ngày`} color="orange" isText />
                <StatCard label="Tổng lượt chơi" value={overview.campaign.totalPlays} color="blue" />
                <StatCard label="Tổng trúng" value={overview.campaign.totalWins} color="green" />
                <StatCard label="Người chơi" value={overview.campaign.totalPlayers} color="purple" />
                <StatCard label="Tỉ lệ trúng" value={overview.campaign.winRate} color="amber" isText />
                <StatCard label="Voucher phát" value={overview.campaign.vouchersIssued} color="teal" />
                <StatCard label="Voucher dùng" value={overview.campaign.vouchersRedeemed} color="cyan" />
              </div>
            </>
          )}

          {/* Reward breakdown */}
          {overview.rewardStats && overview.rewardStats.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider pt-2">
                Phần thưởng
              </h3>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Tên</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Đã phát</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Đã dùng</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Còn lại</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Tỉ lệ dùng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {overview.rewardStats.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                        <td className="px-4 py-3">{formatNumber(r.issued)}</td>
                        <td className="px-4 py-3 text-green-600">{formatNumber(r.redeemed)}</td>
                        <td className="px-4 py-3 text-orange-600">{formatNumber(r.remaining)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={parseFloat(r.redeemRate) > 50 ? 'success' : 'warning'}>
                            {r.redeemRate}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Play Chart ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
        <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:justify-between">
          <h3 className="text-base md:text-lg font-semibold text-gray-900">
            Biểu đồ lượt chơi
          </h3>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            {/* Group by selector */}
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as 'day' | 'week' | 'month')}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="day">Theo ngày</option>
              <option value="week">Theo tuần</option>
              <option value="month">Theo tháng</option>
            </select>

            {/* Date range */}
            <div className="flex gap-1">
              {['7d', '30d', '90d'].map((r) => (
                <button
                  key={r}
                  onClick={() => setDateRange(r)}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    dateRange === r
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {r === '7d' ? '7 ngày' : r === '30d' ? '30 ngày' : '90 ngày'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        {playStats?.summary && (
          <div className="flex gap-6 mb-4 text-sm">
            <div>
              <span className="text-gray-500">Tổng lượt: </span>
              <span className="font-medium">{formatNumber(playStats.summary.totalPlays)}</span>
            </div>
            <div>
              <span className="text-gray-500">Trúng: </span>
              <span className="font-medium text-green-600">
                {formatNumber(playStats.summary.totalWins)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Tỉ lệ: </span>
              <span className="font-medium text-orange-600">{playStats.summary.winRate}</span>
            </div>
          </div>
        )}

        {loadingPlays ? (
          <div className="h-[300px] flex items-center justify-center">
            <Loading size="sm" />
          </div>
        ) : playStats?.chart && playStats.chart.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={playStats.chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(d) => {
                  const date = new Date(d);
                  return `${date.getDate()}/${date.getMonth() + 1}`;
                }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                }}
                labelFormatter={(d) => {
                  const date = new Date(d);
                  return date.toLocaleDateString('vi-VN');
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="plays"
                name="Lượt chơi"
                stroke="#FF6B35"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="wins"
                name="Trúng"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-400">
            Không có dữ liệu trong khoảng thời gian này
          </div>
        )}
      </div>

      {/* ── Voucher Stats ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart - status distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Phân bổ voucher
          </h3>
          {loadingVouchers ? (
            <Loading size="sm" />
          ) : pieData.length > 0 ? (
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={(props) => {
                      const { name, percent } = props as { name?: string; percent?: number };
                      return `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`;
                    }}
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              Chưa có dữ liệu
            </div>
          )}
        </div>

        {/* Bar chart - voucher by reward */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Voucher theo phần thưởng
          </h3>
          {loadingVouchers ? (
            <Loading size="sm" />
          ) : voucherStats?.byReward && voucherStats.byReward.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={voucherStats.byReward}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="rewardName"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                  }}
                />
                <Legend />
                <Bar dataKey="total" name="Phát hành" fill="#FF6B35" radius={[4, 4, 0, 0]} />
                <Bar dataKey="used" name="Đã dùng" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              Chưa có dữ liệu
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Stat Card Component ──────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
  isText = false,
}: {
  label: string;
  value: number | string;
  color: string;
  isText?: boolean;
}) {
  const colorMap: Record<string, string> = {
    orange: 'bg-orange-50 text-orange-700',
    green: 'bg-green-50 text-green-700',
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
    teal: 'bg-teal-50 text-teal-700',
    cyan: 'bg-cyan-50 text-cyan-700',
    amber: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${colorMap[color]?.split(' ')[1] || 'text-gray-900'}`}>
        {isText ? value : formatNumber(value as number)}
      </p>
    </div>
  );
}
