// src/components/admin/StatsCard.tsx
// Reusable dashboard stats card with icon, value, label, and trend indicator
'use client';

import React from 'react';
import { cn, formatNumber } from '@/lib/utils';

type TrendDirection = 'up' | 'down' | 'neutral';

interface StatsCardProps {
  label: string;
  value: number;
  icon: string;
  trend?: {
    value: number;
    direction: TrendDirection;
    label?: string;
  };
  colorClass?: string;
  className?: string;
}

export default function StatsCard({
  label,
  value,
  icon,
  trend,
  colorClass = 'bg-orange-50 text-orange-600',
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4 hover:shadow-sm transition-shadow',
        className
      )}
    >
      {/* Icon */}
      <div className={cn('w-11 h-11 rounded-lg flex items-center justify-center text-xl flex-shrink-0', colorClass)}>
        {icon}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-500 truncate">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{formatNumber(value)}</p>

        {/* Trend */}
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            {trend.direction === 'up' && (
              <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {trend.direction === 'down' && (
              <svg className="w-3.5 h-3.5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            <span
              className={cn(
                'text-xs font-medium',
                trend.direction === 'up' && 'text-green-600',
                trend.direction === 'down' && 'text-red-600',
                trend.direction === 'neutral' && 'text-gray-500'
              )}
            >
              {trend.direction !== 'neutral' && `${trend.value}%`}
              {trend.label && ` ${trend.label}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
