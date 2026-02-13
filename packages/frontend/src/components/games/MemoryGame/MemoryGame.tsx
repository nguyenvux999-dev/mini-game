// src/components/games/MemoryGame/MemoryGame.tsx
// Match cards to win prizes
'use client';

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import CardGrid from './CardGrid';
import { Button } from '@/components/common';
import { useMemoryLogic } from '@/hooks/games/useMemoryLogic';
import { usePlayer } from '@/hooks/usePlayer';
import { useGameStore } from '@/stores/gameStore';
import { usePlayerStore } from '@/stores/playerStore';
import { cn } from '@/lib/utils';
import { resolveGameConfig } from '@/types/game.types';
import type { CampaignInfo, PlayResult } from '@/types/api.types';

interface MemoryGameProps {
  campaign: CampaignInfo;
  className?: string;
}

export default function MemoryGame({ campaign, className }: MemoryGameProps) {
  const { playGame } = usePlayer();
  const { remainingPlays } = usePlayerStore();
  const { gameState, isLoading, setGameState } = useGameStore();
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  // Resolve config from backend with safe defaults
  const config = useMemo(
    () => resolveGameConfig('memory', campaign.gameConfig),
    [campaign.gameConfig],
  );

  const { gridSize, timeLimit, matchesToWin, cardImages } = config;

  const canPlay = remainingPlays > 0 && gameState !== 'playing' && gameState !== 'animating' && !submitting;

  // ── Submit to backend ──────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSubmit = useCallback(async (..._args: [number, number]) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    setGameState('animating');

    const result: PlayResult | null = await playGame('memory');
    if (!result) {
      setGameState('idle');
    }
    setSubmitting(false);
    // Result modal triggered by gameStore.setResult
  }, [playGame, setGameState]);

  // Game logic hook
  const {
    cards,
    matchedPairs,
    timeLeft,
    phase,
    isChecking,
    startGame,
    flipCard,
    cleanup,
  } = useMemoryLogic({
    gridSize,
    cardImages,
    matchesToWin,
    timeLimit,
    onWin: (timeSpent, matched) => handleSubmit(matched, timeSpent),
    onLose: (matched) => handleSubmit(matched, timeLimit),
  });

  // ── Start ──────────────────────────────────────────────────────────
  const handleStart = useCallback(() => {
    if (!canPlay) return;
    submittedRef.current = false;
    setGameState('playing');
    startGame();
  }, [canPlay, setGameState, startGame]);

  // ── Reset on game state change ─────────────────────────────────────
  useEffect(() => {
    if (gameState === 'idle') {
      cleanup();
    }
  }, [gameState, cleanup]);

  return (
    <div className={cn('w-full game-active select-none', className)}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Game area */}
        <div className="relative min-h-[320px] bg-gradient-to-b from-purple-50 to-indigo-50 p-4 flex flex-col items-center justify-center">

          {/* Idle state */}
          {phase === 'idle' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-3"
            >
              <div className="text-6xl">🃏</div>
              <h3 className="text-xl font-bold text-gray-900">Lật Hình</h3>
              <p className="text-sm text-gray-500">
                Tìm {matchesToWin} cặp hình giống nhau trong {timeLimit}s
              </p>
            </motion.div>
          )}

          {/* Peek / Playing phase */}
          {(phase === 'peek' || phase === 'playing' || phase === 'won' || phase === 'lost') && (
            <>
              {/* Timer + Score bar */}
              <div className="w-full flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500">⏱</span>
                  <span className={cn(
                    'text-sm font-bold tabular-nums',
                    timeLeft <= 10 ? 'text-red-500' : 'text-gray-700'
                  )}>
                    {timeLeft}s
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500">✅</span>
                  <span className="text-sm font-bold text-gray-700 tabular-nums">
                    {matchedPairs}/{matchesToWin}
                  </span>
                </div>
              </div>

              {phase === 'peek' && (
                <p className="text-xs text-gray-400 mb-2 animate-pulse">Ghi nhớ vị trí...</p>
              )}

              {/* Card grid */}
              <CardGrid
                cards={cards}
                gridSize={gridSize}
                disabled={phase !== 'playing' || isChecking || submitting}
                onCardClick={flipCard}
              />
            </>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Lượt chơi còn lại</span>
            <span className="font-bold text-[var(--color-primary)]">{remainingPlays}</span>
          </div>

          {(phase === 'idle' || phase === 'won' || phase === 'lost') && (
            <Button
              fullWidth
              size="lg"
              onClick={handleStart}
              loading={isLoading || submitting}
              disabled={!canPlay}
            >
              {phase === 'idle'
                ? canPlay ? '🃏 Bắt đầu!' : '😔 Hết lượt'
                : canPlay ? '🃏 Chơi lại' : '😔 Hết lượt'}
            </Button>
          )}

          {phase === 'playing' && (
            <p className="text-center text-xs text-gray-400">
              Nhấn vào thẻ để lật hình
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
