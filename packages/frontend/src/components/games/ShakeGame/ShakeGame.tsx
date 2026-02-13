// src/components/games/ShakeGame/ShakeGame.tsx
// Shake your phone (or tap button) to win prizes
'use client';

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import FallingObjects, { ShakeTheme } from './FallingObjects';
import { Button } from '@/components/common';
import { useShakeDetect } from '@/hooks/games/useShakeDetect';
import { usePlayer } from '@/hooks/usePlayer';
import { useGameStore } from '@/stores/gameStore';
import { usePlayerStore } from '@/stores/playerStore';
import { cn, getAssetUrl } from '@/lib/utils';
import { resolveGameConfig } from '@/types/game.types';
import type { PlayResult, CampaignInfo } from '@/types/api.types';

const SHAKE_TARGET = 8; // shakes needed to trigger play

interface ShakeGameProps {
  campaign: CampaignInfo;
  className?: string;
}

export default function ShakeGame({ campaign, className }: ShakeGameProps) {
  const { playGame } = usePlayer();
  const { remainingPlays } = usePlayerStore();
  const { gameState, isLoading, setGameState } = useGameStore();

  // Resolve config from backend with safe defaults
  const config = useMemo(
    () => resolveGameConfig('shake', campaign.gameConfig),
    [campaign.gameConfig],
  );

  const theme: ShakeTheme = config.theme;
  const gameDuration = config.duration;
  const backgroundUrl = getAssetUrl(config.background || null);
  const fallingObjectUrl = getAssetUrl(config.fallingObject || null);

  const [phase, setPhase] = useState<'idle' | 'shaking' | 'submitting' | 'done'>('idle');
  const [timeLeft, setTimeLeft] = useState(gameDuration);
  const [fallingCount, setFallingCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const canPlay = remainingPlays > 0 && phase === 'idle' && gameState !== 'playing';

  // Shake detection
  const {
    shakeCount,
    hasMotionSupport,
    permissionGranted,
    requestPermission,
    triggerShake,
    resetShakes,
  } = useShakeDetect({
    threshold: config.shakeSensitivity,
    enabled: phase === 'shaking',
    onShake: () => {
      setFallingCount((c) => c + 3);
    },
  });

  // ── Auto-submit when shake target reached ──────────────────────────
  useEffect(() => {
    if (phase === 'shaking' && shakeCount >= SHAKE_TARGET) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shakeCount, phase]);

  // ── Timer countdown ────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'shaking') {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            // Time's up — submit what we have
            handleSubmit();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Start game ─────────────────────────────────────────────────────
  const handleStart = useCallback(async () => {
    if (!canPlay) return;

    // Request motion permission on iOS
    if (hasMotionSupport && !permissionGranted) {
      const granted = await requestPermission();
      if (!granted) {
        // Fall through to button mode
      }
    }

    setPhase('shaking');
    setGameState('playing');
    setTimeLeft(gameDuration);
    setFallingCount(0);
    resetShakes();
  }, [canPlay, hasMotionSupport, permissionGranted, requestPermission, setGameState, resetShakes, gameDuration]);

  // ── Submit result ──────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (phase !== 'shaking') return;
    setPhase('submitting');
    setGameState('animating');
    if (timerRef.current) clearInterval(timerRef.current);

    const result: PlayResult | null = await playGame('shake');
    if (!result) {
      setPhase('idle');
      setGameState('idle');
      return;
    }

    setPhase('done');
    // Result modal triggered by gameStore.setResult
  }, [phase, playGame, setGameState]);

  // ── Reset for next play ────────────────────────────────────────────
  useEffect(() => {
    if (gameState === 'idle' && phase === 'done') {
      setPhase('idle');
      resetShakes();
      setFallingCount(0);
      setTimeLeft(gameDuration);
    }
  }, [gameState, phase, resetShakes, gameDuration]);

  // Progress percentage
  const shakeProgress = Math.min((shakeCount / SHAKE_TARGET) * 100, 100);

  return (
    <div className={cn('w-full game-active select-none', className)}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Game area */}
        <div className="relative w-full min-h-[400px] aspect-[4/5] max-h-96 flex flex-col items-center justify-center overflow-hidden">
          {/* Background layer */}
          <div
            className="absolute inset-0 w-full h-full"
            style={
              backgroundUrl
                ? {
                    backgroundImage: `url(${backgroundUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }
                : {
                    background: 'linear-gradient(to bottom, rgb(240 253 244), rgb(209 250 229))',
                  }
            }
          />
          
          {/* Falling objects layer */}
          <FallingObjects
            theme={theme}
            count={fallingCount}
            active={phase === 'shaking' || phase === 'submitting'}
            customImage={fallingObjectUrl}
          />

          {/* Center content */}
          <div className="relative z-20 text-center px-4">
            {phase === 'idle' && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-3"
              >
                <div className="text-6xl">
                  {theme === 'tree' ? '🌳' : theme === 'santa' ? '🎅' : '🎆'}
                </div>
                <h3 className="text-xl font-bold text-gray-900">Lắc Xì</h3>
                <p className="text-sm text-gray-500">
                  {hasMotionSupport
                    ? 'Lắc điện thoại để nhận quà!'
                    : 'Nhấn nút LẮC để nhận quà!'}
                </p>
              </motion.div>
            )}

            {phase === 'shaking' && (
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 0.5 } }}
                className="space-y-4"
              >
                {/* Timer */}
                <div className="text-4xl font-bold text-[var(--color-primary)]">
                  {timeLeft}s
                </div>

                {/* Shake icon */}
                <motion.div
                  animate={{ rotate: [-5, 5, -5], transition: { repeat: Infinity, duration: 0.2 } }}
                  className="text-5xl"
                >
                  📱
                </motion.div>

                {/* Progress */}
                <div className="w-48 mx-auto">
                  <div className="h-3 bg-white/60 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[var(--color-primary)] rounded-full"
                      animate={{ width: `${shakeProgress}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {shakeCount}/{SHAKE_TARGET} lần lắc
                  </p>
                </div>

                {/* Desktop fallback button */}
                {!hasMotionSupport && (
                  <button
                    onClick={triggerShake}
                    className="mt-2 px-8 py-4 bg-[var(--color-primary)] text-white text-xl font-bold rounded-2xl
                             active:scale-95 transition-transform shadow-lg touch-manipulation"
                  >
                    🤝 LẮC!
                  </button>
                )}
              </motion.div>
            )}

            {phase === 'submitting' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                <svg className="w-10 h-10 mx-auto animate-spin text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm text-gray-500">Đang mở quà...</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Lượt chơi còn lại</span>
            <span className="font-bold text-[var(--color-primary)]">{remainingPlays}</span>
          </div>

          {phase === 'idle' && (
            <Button
              fullWidth
              size="lg"
              onClick={handleStart}
              loading={isLoading}
              disabled={!canPlay}
            >
              {canPlay ? '🎋 Bắt đầu lắc!' : '😔 Hết lượt'}
            </Button>
          )}

          {phase === 'shaking' && hasMotionSupport && (
            <p className="text-center text-xs text-gray-400 animate-pulse">
              Lắc mạnh điện thoại của bạn!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
