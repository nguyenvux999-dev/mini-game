// src/components/admin/RecentVouchers.tsx
// Recent vouchers table for dashboard with quick redeem action
'use client';

import React from 'react';
import type { VoucherWithRelations } from '@/types/api.types';
import { Badge } from '@/components/common';
import { formatDateTime, obfuscatePhone, formatCurrency } from '@/lib/utils';
import { VOUCHER_STATUS_LABELS } from '@/lib/constants';

interface RecentVouchersProps {
  vouchers: VoucherWithRelations[];
  loading?: boolean;
  onRedeem?: (code: string) => void;
}

const statusVariant: Record<string, 'success' | 'info' | 'default' | 'error'> = {
  active: 'success',
  used: 'info',
  expired: 'default',
  cancelled: 'error',
};

export default function RecentVouchers({ vouchers, loading, onRedeem }: RecentVouchersProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="h-5 bg-gray-200 rounded w-40 animate-pulse" />
        </div>
        <div className="p-5 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Voucher gần đây</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Mã</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Phần thưởng</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">SĐT</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Ngày tạo</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {vouchers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Chưa có voucher nào
                </td>
              </tr>
            ) : (
              vouchers.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-2.5 font-mono text-xs font-medium text-gray-900">
                    {v.code}
                  </td>
                  <td className="px-4 py-2.5 text-gray-700">
                    {v.reward?.name}
                    {v.reward?.value ? (
                      <span className="text-gray-400 text-xs ml-1">({formatCurrency(v.reward.value)})</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 hidden sm:table-cell">
                    {v.player ? obfuscatePhone(v.player.phone) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs hidden md:table-cell">
                    {formatDateTime(v.createdAt)}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant={statusVariant[v.status] || 'default'}>
                      {VOUCHER_STATUS_LABELS[v.status] || v.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {v.status === 'active' && onRedeem && (
                      <button
                        onClick={() => onRedeem(v.code)}
                        className="text-xs font-medium text-orange-600 hover:text-orange-700 transition-colors"
                      >
                        Đổi voucher
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
