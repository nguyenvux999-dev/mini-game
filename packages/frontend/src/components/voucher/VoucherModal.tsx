// src/components/voucher/VoucherModal.tsx
// Modal showing game result: Win (voucher), Lose, or Error states
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { usePlayerStore } from '@/stores/playerStore';
import { Button, Modal } from '@/components/common';
import VoucherCard from './VoucherCard';
import QRDisplay from './QRDisplay';
import { cn } from '@/lib/utils';

interface VoucherModalProps {
  /** Callback after modal close — e.g., to reset game */
  onClose?: () => void;
}

export default function VoucherModal({ onClose }: VoucherModalProps) {
  const { showResult, lastResult, closeResult } = useGameStore();
  const { remainingPlays } = usePlayerStore();

  const handleClose = () => {
    closeResult();
    onClose?.();
  };

  if (!lastResult) return null;

  const isWin = lastResult.isWin;

  return (
    <Modal
      isOpen={showResult}
      onClose={handleClose}
      size="sm"
      closeOnBackdrop={false}
      showClose={false}
    >
      <div className="text-center">
        <AnimatePresence mode="wait">
          {isWin ? (
            <WinContent
              key="win"
              rewardName={lastResult.rewardName}
              rewardIcon={lastResult.rewardIcon}
              voucherCode={lastResult.voucherCode}
              qrCode={lastResult.qrCode}
              expiresAt={lastResult.expiresAt}
              remainingPlays={remainingPlays}
              onClose={handleClose}
            />
          ) : (
            <LoseContent
              key="lose"
              remainingPlays={remainingPlays}
              onClose={handleClose}
            />
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}

// ── Win State ───────────────────────────────────────────────────────────────

interface WinContentProps {
  rewardName: string | null;
  rewardIcon: string | null;
  voucherCode: string | null;
  qrCode: string | null;
  expiresAt: string | null;
  remainingPlays: number;
  onClose: () => void;
}

function WinContent({
  rewardName,
  rewardIcon,
  voucherCode,
  qrCode,
  expiresAt,
  remainingPlays,
  onClose,
}: WinContentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', duration: 0.5 }}
      className="space-y-4"
    >
      {/* Celebration emoji */}
      <motion.div
        initial={{ rotate: -10, scale: 0.5 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ type: 'spring', bounce: 0.6 }}
        className="text-6xl"
      >
        🎉
      </motion.div>

      <div>
        <h3 className="text-xl font-bold text-gray-900">Chúc mừng!</h3>
        <p className="text-sm text-gray-500 mt-1">Bạn đã trúng thưởng</p>
      </div>

      {/* Voucher card */}
      <VoucherCard
        rewardName={rewardName}
        rewardIcon={rewardIcon}
        voucherCode={voucherCode}
        expiresAt={expiresAt}
      />

      {/* QR Code */}
      {qrCode && (
        <QRDisplay value={qrCode} size={140} />
      )}

      {/* Remaining plays info */}
      {remainingPlays > 0 && (
        <p className="text-xs text-gray-400">
          Bạn còn <span className="font-semibold text-[var(--color-primary)]">{remainingPlays}</span> lượt chơi
        </p>
      )}

      <Button fullWidth onClick={onClose}>
        {remainingPlays > 0 ? 'Tiếp tục chơi' : 'Đóng'}
      </Button>
    </motion.div>
  );
}

// ── Lose State ──────────────────────────────────────────────────────────────

interface LoseContentProps {
  remainingPlays: number;
  onClose: () => void;
}

function LoseContent({ remainingPlays, onClose }: LoseContentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', duration: 0.5 }}
      className="space-y-4"
    >
      {/* Sad emoji */}
      <motion.div
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', bounce: 0.4 }}
        className="text-6xl"
      >
        😔
      </motion.div>

      <div>
        <h3 className="text-xl font-bold text-gray-900">Chưa trúng rồi!</h3>
        <p className="text-sm text-gray-500 mt-1">
          {remainingPlays > 0
            ? 'Đừng bỏ cuộc, hãy thử lại nhé!'
            : 'Bạn đã hết lượt chơi. Cảm ơn bạn đã tham gia!'}
        </p>
      </div>

      {/* Remaining plays info */}
      {remainingPlays > 0 && (
        <div className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full',
          'bg-orange-50 text-sm'
        )}>
          <span className="text-gray-600">Còn</span>
          <span className="font-bold text-[var(--color-primary)]">{remainingPlays}</span>
          <span className="text-gray-600">lượt</span>
        </div>
      )}

      <Button fullWidth onClick={onClose}>
        {remainingPlays > 0 ? '🎮 Thử lại' : 'Đóng'}
      </Button>
    </motion.div>
  );
}
