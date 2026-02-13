// src/components/games/TapGame/EatingVariant.tsx
// "Tap as fast as you can" eating game with countdown
'use client';

import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/common';
import { useTapCounter } from '@/hooks/games/useTapCounter';
import { cn } from '@/lib/utils';

interface EatingVariantProps {
  targetTaps?: number;
  timeLimit?: number;
  onComplete: (tapCount: number) => void;
  disabled?: boolean;
  /** Custom character image URL from game_assets */
  characterImage?: string | null;
  /** Custom target item image URL from game_assets */
  targetItemImage?: string | null;
}

export default function EatingVariant({
  targetTaps = 50,
  timeLimit = 10,
  onComplete,
  disabled,
  characterImage,
  targetItemImage,
}: EatingVariantProps) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready');
  const [finalTaps, setFinalTaps] = useState(0);

  const {
    tapCount,
    timeLeft,
    isActive,
    start,
    tap,
    reset: resetCounter,
  } = useTapCounter({
    timeLimit,
    onTimeUp: (taps) => {
      setFinalTaps(taps);
      setPhase('done');
      onComplete(taps);
    },
  });

  const progress = Math.min((tapCount / targetTaps) * 100, 100);

  // Character animation stage
  const eatStage = tapCount < targetTaps * 0.3 ? 0 : tapCount < targetTaps * 0.7 ? 1 : 2;
  const defaultChars = ['😋', '🤤', '🥳'];

  // Render character: custom image or emoji
  const renderCharacter = () => {
    if (characterImage) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={characterImage} alt="" className="w-14 h-14 object-contain" />;
    }
    return defaultChars[eatStage];
  };

  const handleStart = useCallback(() => {
    resetCounter();
    setFinalTaps(0);
    setPhase('playing');
    start();
  }, [resetCounter, start]);

  const handleTap = useCallback(() => {
    if (!isActive || disabled) return;
    tap();
  }, [isActive, disabled, tap]);

  return (
    <div className="flex flex-col items-center space-y-4 w-full px-4">
      {/* Title */}
      <div className="text-center">
        <motion.div
          className="text-5xl mb-2"
          animate={isActive ? { scale: [1, 1.15, 1] } : {}}
          transition={{ repeat: Infinity, duration: 0.3 }}
        >
          {renderCharacter()}
        </motion.div>
        <h4 className="text-lg font-bold text-gray-900">Tap nhanh nào!</h4>
        <p className="text-xs text-gray-500">
          Nhấn {targetTaps} lần trong {timeLimit} giây
        </p>
      </div>

      {/* Timer */}
      <div className={cn(
        'text-3xl font-bold tabular-nums',
        timeLeft <= 3 ? 'text-red-500' : 'text-gray-700'
      )}>
        {phase === 'ready' ? `${timeLimit}s` : `${timeLeft}s`}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-[260px]">
        <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
          <motion.div
            className={cn(
              'h-full rounded-full transition-colors',
              progress >= 100 ? 'bg-green-400' : 'bg-[var(--color-primary)]'
            )}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
            {tapCount}/{targetTaps}
          </span>
        </div>
      </div>

      {/* Tap area */}
      {phase === 'ready' && (
        <Button onClick={handleStart} size="lg" disabled={disabled}>
          🍔 Bắt đầu ăn!
        </Button>
      )}

      {phase === 'playing' && (
        <motion.button
          onClick={handleTap}
          whileTap={{ scale: 0.85 }}
          className="w-28 h-28 rounded-full bg-[var(--color-primary)] text-white
                     shadow-xl active:shadow-md transition-shadow touch-manipulation
                     flex flex-col items-center justify-center select-none"
        >
          <span className="text-3xl">{targetItemImage
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={targetItemImage} alt="" className="w-8 h-8 object-contain" />
            : '👆'}</span>
          <span className="text-sm font-bold mt-0.5">TAP!</span>
        </motion.button>
      )}

      {phase === 'done' && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <p className="text-lg font-bold text-gray-900">
            {finalTaps >= targetTaps ? '🎉 Hoàn thành!' : `${finalTaps} lần tap`}
          </p>
          <p className="text-xs text-gray-500 mt-1">Đang xử lý kết quả...</p>
        </motion.div>
      )}
    </div>
  );
}
