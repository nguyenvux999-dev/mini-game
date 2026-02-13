// src/components/games/GameRenderer.tsx
// Main game container — detects game type and renders appropriate game component
'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { usePlayerStore } from '@/stores/playerStore';
import { usePlayer } from '@/hooks/usePlayer';
import { GAME_TYPE_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { GameType, RewardInfo, CampaignInfo } from '@/types/api.types';

// Lazy-load game components to reduce initial bundle
import dynamic from 'next/dynamic';

const WheelGame = dynamic(() => import('./WheelGame/WheelGame'), {
  loading: () => <GameLoadingPlaceholder />,
});
const ShakeGame = dynamic(() => import('./ShakeGame/ShakeGame'), {
  loading: () => <GameLoadingPlaceholder />,
});
const MemoryGame = dynamic(() => import('./MemoryGame/MemoryGame'), {
  loading: () => <GameLoadingPlaceholder />,
});
const TapGame = dynamic(() => import('./TapGame/TapGame'), {
  loading: () => <GameLoadingPlaceholder />,
});

function GameLoadingPlaceholder() {
  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex items-center justify-center min-h-[300px]">
      <div className="flex flex-col items-center gap-3">
        <svg className="w-8 h-8 animate-spin text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm text-gray-400">Đang tải game...</span>
      </div>
    </div>
  );
}

interface GameRendererProps {
  gameType: GameType;
  rewards: RewardInfo[];
  campaign: CampaignInfo;
  className?: string;
}

export default function GameRenderer({ gameType, rewards, campaign, className }: GameRendererProps) {
  const { checkEligibility } = usePlayer();
  const { isRegistered } = usePlayerStore();
  const { setGameType } = useGameStore();
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  // Set active game type
  useEffect(() => {
    setGameType(gameType);
  }, [gameType, setGameType]);

  // Check eligibility on mount (if registered)
  useEffect(() => {
    if (isRegistered) {
      setCheckingEligibility(true);
      checkEligibility().finally(() => setCheckingEligibility(false));
    }
  }, [isRegistered, checkEligibility]);

  const gameLabel = GAME_TYPE_LABELS[gameType] ?? gameType;

  // Not registered yet — show teaser
  if (!isRegistered) {
    return (
      <section className={cn('w-full', className)}>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-orange-50 flex items-center justify-center">
            <GameIcon gameType={gameType} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">{gameLabel}</h3>
          <p className="text-sm text-gray-500">
            Đăng ký ở trên để tham gia chơi game
          </p>
        </div>
      </section>
    );
  }

  // Checking eligibility
  if (checkingEligibility) {
    return (
      <section className={cn('w-full', className)}>
        <GameLoadingPlaceholder />
      </section>
    );
  }

  // Render game by type
  return (
    <section className={cn('w-full', className)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {gameType === 'wheel' && (
          <WheelGame rewards={rewards} campaign={campaign} />
        )}
        {gameType === 'shake' && (
          <ShakeGame campaign={campaign} />
        )}
        {gameType === 'memory' && (
          <MemoryGame campaign={campaign} />
        )}
        {gameType === 'tap' && (
          <TapGame campaign={campaign} />
        )}
      </motion.div>
    </section>
  );
}

// ── Game Icon helper ────────────────────────────────────────────────────────

function GameIcon({ gameType, size = 'md' }: { gameType: GameType; size?: 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'text-5xl' : 'text-3xl';

  const icons: Record<GameType, string> = {
    wheel: '🎡',
    shake: '🎋',
    memory: '🃏',
    tap: '👆',
  };

  return <span className={sizeClass}>{icons[gameType] ?? '🎮'}</span>;
}
