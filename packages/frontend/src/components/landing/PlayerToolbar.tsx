// src/components/landing/PlayerToolbar.tsx
// Toolbar showing player info, my-vouchers toggle, and logout
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { usePlayerStore } from '@/stores/playerStore';
import { useGameStore } from '@/stores/gameStore';
import { cn, obfuscatePhone } from '@/lib/utils';

interface PlayerToolbarProps {
  /** Whether the voucher list is currently visible */
  showVouchers: boolean;
  /** Toggle voucher list visibility */
  onToggleVouchers: () => void;
  className?: string;
}

export default function PlayerToolbar({
  showVouchers,
  onToggleVouchers,
  className,
}: PlayerToolbarProps) {
  const { player, clearPlayer } = usePlayerStore();
  const { resetGame } = useGameStore();

  if (!player) return null;

  const handleLogout = () => {
    resetGame();
    clearPlayer();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-white rounded-xl border border-gray-100 shadow-sm p-3',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        {/* Player info */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm">👤</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {player.name || 'Người chơi'}
            </p>
            <p className="text-xs text-gray-400">{obfuscatePhone(player.phone)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* My Vouchers toggle */}
          <button
            onClick={onToggleVouchers}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              showVouchers
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            )}
          >
            🎟️ Voucher
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </motion.div>
  );
}
