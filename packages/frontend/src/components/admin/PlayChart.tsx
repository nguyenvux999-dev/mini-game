// src/components/admin/PlayChart.tsx
// Line chart for play statistics using Recharts
'use client';

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { PlayStatsItem } from '@/types/api.types';

interface PlayChartProps {
  data: PlayStatsItem[];
  className?: string;
}

export default function PlayChart({ data, className }: PlayChartProps) {
  const chartData = useMemo(
    () =>
      (data || []).map((item) => ({
        date: new Date(item.date).toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
        }),
        'Lượt chơi': item.plays,
        'Trúng thưởng': item.wins,
      })),
    [data]
  );

  if (!data || data.length === 0) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
          Chưa có dữ liệu thống kê
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '0.75rem',
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              fontSize: '13px',
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '13px', paddingTop: '12px' }}
          />
          <Line
            type="monotone"
            dataKey="Lượt chơi"
            stroke="#f97316"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="Trúng thưởng"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
