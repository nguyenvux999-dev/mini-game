// src/components/voucher/VoucherCard.tsx
// Display voucher details (code, reward, expiry)
'use client';

import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { cn, formatDate, isExpired, getAssetUrl } from '@/lib/utils';
import Image from 'next/image';

interface VoucherCardProps {
  rewardName: string | null;
  rewardIcon: string | null;
  voucherCode: string | null;
  expiresAt: string | null;
  className?: string;
}

export default function VoucherCard({
  rewardName,
  rewardIcon,
  voucherCode,
  expiresAt,
  className,
}: VoucherCardProps) {
  const [copied, setCopied] = useState(false);
  const iconUrl = getAssetUrl(rewardIcon);
  const expired = isExpired(expiresAt);

  const handleCopy = useCallback(async () => {
    if (!voucherCode) return;
    try {
      await navigator.clipboard.writeText(voucherCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = voucherCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [voucherCode]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-4',
        'border border-dashed border-orange-200',
        className
      )}
    >
      {/* Reward info */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0">
          {iconUrl ? (
            <Image src={iconUrl} alt={rewardName ?? ''} width={40} height={40} className="object-contain" />
          ) : (
            <span className="text-2xl">🎁</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">
            {rewardName ?? 'Phần thưởng'}
          </p>
          {expiresAt && (
            <p className={cn(
              'text-xs',
              expired ? 'text-red-500' : 'text-gray-400'
            )}>
              {expired ? 'Đã hết hạn' : `HSD: ${formatDate(expiresAt)}`}
            </p>
          )}
        </div>
      </div>

      {/* Voucher Code with dashed separator */}
      {voucherCode && (
        <>
          <div className="border-t border-dashed border-orange-200 my-3" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">
                Mã voucher
              </p>
              <p className="text-lg font-mono font-bold text-[var(--color-primary)] tracking-wider">
                {voucherCode}
              </p>
            </div>
            <button
              onClick={handleCopy}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                copied
                  ? 'bg-green-100 text-green-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              )}
            >
              {copied ? '✓ Đã sao' : 'Sao chép'}
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}
