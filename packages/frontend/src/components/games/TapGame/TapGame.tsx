// src/components/games/TapGame/TapGame.tsx
// Tap game — 2 variants: Cooking (stop at right moment) & Eating (tap fast)
'use client';

import React, { useCallback, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import CookingVariant from './CookingVariant';
import EatingVariant from './EatingVariant';
import { Button } from '@/components/common';
import { usePlayer } from '@/hooks/usePlayer';
import { useGameStore } from '@/stores/gameStore';
import { usePlayerStore } from '@/stores/playerStore';
import { cn, getAssetUrl } from '@/lib/utils';
import { resolveGameConfig } from '@/types/game.types';
import type { CampaignInfo, PlayResult } from '@/types/api.types';

interface TapGameProps {
  campaign: CampaignInfo;
  className?: string;
}

export default function TapGame({ campaign, className }: TapGameProps) {
  const { playGame } = usePlayer();
  const { remainingPlays } = usePlayerStore();
  const { gameState, isLoading, setGameState } = useGameStore();
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  // Resolve config from backend with safe defaults
  const config = useMemo(
    () => resolveGameConfig('tap', campaign.gameConfig),
    [campaign.gameConfig],
  );

  const { variant, targetTaps, timeLimit, perfectZones } = config;
  const characterImage = getAssetUrl(config.character || null);
  const targetItemImage = getAssetUrl(config.targetItem || null);

  const canPlay = remainingPlays > 0 && gameState !== 'playing' && gameState !== 'animating' && !submitting;

  // ── Submit result to backend ───────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleComplete = useCallback(async (..._args: [number]) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    setGameState('animating');

    const result: PlayResult | null = await playGame('tap');
    if (!result) {
      setGameState('idle');
    }
    setSubmitting(false);
    // Result modal triggered by gameStore.setResult in usePlayer
  }, [playGame, setGameState]);

  // ── Handle start ───────────────────────────────────────────────────
  const handleStart = useCallback(() => {
    if (!canPlay) return;
    submittedRef.current = false;
    setGameState('playing');
  }, [canPlay, setGameState]);

  return (
    <div className={cn('w-full game-active select-none', className)}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Game area */}
        <div className="relative min-h-[350px] bg-gradient-to-b from-amber-50 to-orange-50 p-4 flex flex-col items-center justify-center">
          {gameState !== 'playing' && gameState !== 'animating' ? (
            /* Idle state */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-3"
            >
              <div className="text-6xl">
                {characterImage
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={characterImage} alt="" className="w-16 h-16 object-contain mx-auto" />
                  : variant === 'cooking' ? '🍳' : '🍔'}
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {variant === 'cooking' ? 'Nấu ăn' : 'Ăn nhanh'}
              </h3>
              <p className="text-sm text-gray-500">
                {variant === 'cooking'
                  ? 'Dừng đúng vùng xanh 3 lần để thắng!'
                  : `Nhấn ${targetTaps} lần trong ${timeLimit}s!`}
              </p>
            </motion.div>
          ) : (
            /* Active game */
            <>
              {variant === 'cooking' ? (
                <CookingVariant
                  perfectZones={perfectZones}
                  onComplete={handleComplete}
                  disabled={submitting}
                  characterImage={characterImage}
                />
              ) : (
                <EatingVariant
                  targetTaps={targetTaps}
                  timeLimit={timeLimit}
                  onComplete={handleComplete}
                  disabled={submitting}
                  characterImage={characterImage}
                  targetItemImage={targetItemImage}
                />
              )}
            </>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Lượt chơi còn lại</span>
            <span className="font-bold text-[var(--color-primary)]">{remainingPlays}</span>
          </div>

          {gameState !== 'playing' && gameState !== 'animating' && (
            <Button
              fullWidth
              size="lg"
              onClick={handleStart}
              loading={isLoading || submitting}
              disabled={!canPlay}
            >
              {canPlay
                ? variant === 'cooking' ? '🍳 Bắt đầu nấu!' : '🍔 Bắt đầu ăn!'
                : '😔 Hết lượt'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
