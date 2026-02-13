// src/components/landing/PlayerVoucherList.tsx
// Collapsible list of player's won vouchers with status filtering
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playerApi } from '@/lib/api';
import { usePlayerStore } from '@/stores/playerStore';
import { cn, formatDate, isExpired, getAssetUrl } from '@/lib/utils';
import { Loading } from '@/components/common';
import { QRDisplay } from '@/components/voucher';
import Image from 'next/image';
import type { VoucherWithRelations, VoucherStatus } from '@/types/api.types';

type FilterTab = 'all' | VoucherStatus;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'active', label: 'Còn hạn' },
  { key: 'used', label: 'Đã dùng' },
  { key: 'expired', label: 'Hết hạn' },
];

interface PlayerVoucherListProps {
  className?: string;
}

export default function PlayerVoucherList({ className }: PlayerVoucherListProps) {
  const { player } = usePlayerStore();
  const [vouchers, setVouchers] = useState<VoucherWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const fetchVouchers = useCallback(async () => {
    if (!player?.id) return;

    setLoading(true);
    setError(null);

    try {
      const query = activeFilter !== 'all' ? { status: activeFilter } : undefined;
      const result = await playerApi.getMyVouchers(player.id, query);
      setVouchers(result.vouchers);
    } catch {
      setError('Không thể tải danh sách voucher');
    } finally {
      setLoading(false);
    }
  }, [player?.id, activeFilter]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn('overflow-hidden', className)}
    >
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">🎟️ Voucher của tôi</h3>
        </div>

        {/* Filter tabs */}
        <div className="px-4 pt-3 flex gap-1.5 overflow-x-auto scrollbar-hide">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
                activeFilter === tab.key
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <div className="py-6 flex justify-center">
              <Loading size="sm" text="Đang tải..." />
            </div>
          ) : error ? (
            <div className="py-6 text-center">
              <p className="text-sm text-red-500">{error}</p>
              <button
                onClick={fetchVouchers}
                className="mt-2 text-xs text-[var(--color-primary)] font-medium hover:underline"
              >
                Thử lại
              </button>
            </div>
          ) : vouchers.length === 0 ? (
            <div className="py-8 text-center">
              <span className="text-3xl block mb-2">🎫</span>
              <p className="text-sm text-gray-400">
                {activeFilter === 'all'
                  ? 'Bạn chưa có voucher nào'
                  : 'Không có voucher nào'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <AnimatePresence mode="popLayout">
                {vouchers.map((voucher) => (
                  <VoucherItem key={voucher.id} voucher={voucher} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Single Voucher Item ────────────────────────────────────────────────────

const VoucherItem = React.forwardRef<HTMLDivElement, { voucher: VoucherWithRelations }>(
  function VoucherItem({ voucher }, ref) {
    const [copied, setCopied] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const iconUrl = getAssetUrl(voucher.reward?.iconUrl ?? null);
    const expired = voucher.status === 'expired' || isExpired(voucher.expiresAt);
    const isUsed = voucher.status === 'used';
    const isActive = voucher.status === 'active' && !expired;

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(voucher.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = voucher.code;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [voucher.code]);

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      onClick={() => setExpanded(!expanded)}
      className={cn(
        'rounded-lg border p-3 cursor-pointer transition-all',
        isActive
          ? 'border-green-200 bg-green-50/50 hover:bg-green-50'
          : isUsed
            ? 'border-gray-200 bg-gray-50/50'
            : 'border-red-100 bg-red-50/30',
      )}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden',
          isActive ? 'bg-white shadow-sm' : 'bg-gray-100',
        )}>
          {iconUrl ? (
            <Image src={iconUrl} alt="" width={32} height={32} className="object-contain" />
          ) : (
            <span className="text-lg">{isActive ? '🎁' : isUsed ? '✅' : '⏰'}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-sm font-medium truncate',
            isActive ? 'text-gray-900' : 'text-gray-500',
          )}>
            {voucher.reward?.name ?? 'Phần thưởng'}
          </p>
          <p className="text-xs text-gray-400 font-mono">{voucher.code}</p>
        </div>

        {/* Status badge */}
        <div className="flex-shrink-0">
          {isActive ? (
            <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-medium">
              Còn hạn
            </span>
          ) : isUsed ? (
            <span className="inline-block px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 text-[10px] font-medium">
              Đã dùng
            </span>
          ) : (
            <span className="inline-block px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-medium">
              Hết hạn
            </span>
          )}
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-dashed border-gray-200 space-y-2">
              {voucher.expiresAt && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Hạn sử dụng</span>
                  <span className={expired ? 'text-red-500' : 'text-gray-600'}>
                    {formatDate(voucher.expiresAt)}
                  </span>
                </div>
              )}
              {voucher.campaign && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Chiến dịch</span>
                  <span className="text-gray-600">{voucher.campaign.name}</span>
                </div>
              )}
              {isActive && voucher.qrData && (
                <div className="flex justify-center py-2">
                  <QRDisplay value={voucher.qrData} size={120} />
                </div>
              )}
              {isActive && (
                <button
                  onClick={handleCopy}
                  className={cn(
                    'w-full mt-1 py-2 rounded-lg text-xs font-medium transition-all',
                    copied
                      ? 'bg-green-100 text-green-700'
                      : 'bg-[var(--color-primary)] text-white active:scale-[0.98]',
                  )}
                >
                  {copied ? '✓ Đã sao chép mã' : '📋 Sao chép mã voucher'}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

VoucherItem.displayName = 'VoucherItem';
