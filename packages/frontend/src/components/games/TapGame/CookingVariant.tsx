// src/components/games/TapGame/CookingVariant.tsx
// "Stop at the right moment" cooking game — progress bar with perfect zones
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/common';
import { cn } from '@/lib/utils';

interface PerfectZone {
  start: number; // percentage 0-100
  width: number; // percentage
}

interface CookingVariantProps {
  perfectZones?: number;
  onComplete: (perfectHits: number) => void;
  disabled?: boolean;
  /** Custom character image URL from game_assets */
  characterImage?: string | null;
}

const CYCLE_DURATION = 2000; // ms for one full cycle
const REQUIRED_PERFECTS = 3;

function generateZones(count: number): PerfectZone[] {
  const zones: PerfectZone[] = [];
  const spacing = 100 / (count + 1);
  for (let i = 0; i < count; i++) {
    zones.push({
      start: spacing * (i + 0.5) + Math.random() * (spacing * 0.3),
      width: 12 + Math.random() * 6, // 12-18% width
    });
  }
  return zones;
}

export default function CookingVariant({
  perfectZones: zoneCount = 3,
  onComplete,
  disabled,
  characterImage,
}: CookingVariantProps) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready');
  const [position, setPosition] = useState(0);
  const [perfectHits, setPerfectHits] = useState(0);
  const [round, setRound] = useState(0);
  const [lastHitResult, setLastHitResult] = useState<'perfect' | 'miss' | null>(null);
  const [zones] = useState<PerfectZone[]>(() => generateZones(zoneCount));

  const animRef = useRef<number>(0);
  const startTimeRef = useRef(0);

  // ── Animate progress bar bounce ────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return;

    startTimeRef.current = performance.now();

    function animate(now: number) {
      const elapsed = now - startTimeRef.current;
      // Bounce back and forth
      const cycle = (elapsed % CYCLE_DURATION) / CYCLE_DURATION;
      const pos = cycle < 0.5 ? cycle * 2 * 100 : (1 - (cycle - 0.5) * 2) * 100;
      setPosition(pos);
      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase]);

  // ── Handle tap ─────────────────────────────────────────────────────
  const handleTap = useCallback(() => {
    if (phase !== 'playing' || disabled) return;
    cancelAnimationFrame(animRef.current);

    // Check if position is in any perfect zone
    const inZone = zones.some(
      (z) => position >= z.start && position <= z.start + z.width
    );

    const newHits = inZone ? perfectHits + 1 : perfectHits;
    setPerfectHits(newHits);
    setLastHitResult(inZone ? 'perfect' : 'miss');

    const newRound = round + 1;
    setRound(newRound);

    if (newRound >= REQUIRED_PERFECTS) {
      // Game over
      setPhase('done');
      onComplete(newHits);
      return;
    }

    // Brief pause then continue
    setTimeout(() => {
      setLastHitResult(null);
      startTimeRef.current = performance.now();
      const animate = (now: number) => {
        const elapsed = now - startTimeRef.current;
        const cycle = (elapsed % CYCLE_DURATION) / CYCLE_DURATION;
        const pos = cycle < 0.5 ? cycle * 2 * 100 : (1 - (cycle - 0.5) * 2) * 100;
        setPosition(pos);
        animRef.current = requestAnimationFrame(animate);
      };
      animRef.current = requestAnimationFrame(animate);
    }, 500);
  }, [phase, disabled, position, zones, perfectHits, round, onComplete]);

  // ── Start ──────────────────────────────────────────────────────────
  const handleStart = useCallback(() => {
    setPerfectHits(0);
    setRound(0);
    setLastHitResult(null);
    setPhase('playing');
  }, []);

  return (
    <div className="flex flex-col items-center space-y-4 w-full px-4">
      {/* Title */}
      <div className="text-center">
        <div className="text-5xl mb-2">
          {characterImage
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={characterImage} alt="" className="w-14 h-14 object-contain mx-auto" />
            : '🍳'}
        </div>
        <h4 className="text-lg font-bold text-gray-900">Dừng đúng lúc!</h4>
        <p className="text-xs text-gray-500">
          Nhấn khi thanh chạy vào vùng xanh ({round}/{REQUIRED_PERFECTS})
        </p>
      </div>

      {/* Progress bar with zones */}
      <div className="w-full max-w-[280px]">
        <div className="relative h-10 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
          {/* Perfect zones */}
          {zones.map((zone, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 bg-green-400/40 border-x border-green-500/30"
              style={{ left: `${zone.start}%`, width: `${zone.width}%` }}
            />
          ))}

          {/* Moving indicator */}
          <motion.div
            className="absolute top-0 bottom-0 w-1.5 bg-[var(--color-primary)] rounded-full shadow-md"
            style={{ left: `${position}%` }}
          />
        </div>
      </div>

      {/* Hit result feedback */}
      {lastHitResult && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            'text-lg font-bold',
            lastHitResult === 'perfect' ? 'text-green-500' : 'text-red-400'
          )}
        >
          {lastHitResult === 'perfect' ? '✨ Perfect!' : '💨 Miss!'}
        </motion.div>
      )}

      {/* Score dots */}
      <div className="flex gap-2">
        {Array.from({ length: REQUIRED_PERFECTS }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-4 h-4 rounded-full border-2 transition-colors',
              i < perfectHits
                ? 'bg-green-400 border-green-500'
                : i < round
                ? 'bg-red-300 border-red-400'
                : 'bg-gray-100 border-gray-300'
            )}
          />
        ))}
      </div>

      {/* Action */}
      {phase === 'ready' && (
        <Button onClick={handleStart} size="lg" disabled={disabled}>
          🍳 Bắt đầu nấu!
        </Button>
      )}

      {phase === 'playing' && (
        <button
          onClick={handleTap}
          className="w-24 h-24 rounded-full bg-[var(--color-primary)] text-white text-lg font-bold
                     shadow-lg active:scale-90 transition-transform touch-manipulation
                     flex items-center justify-center"
        >
          TAP!
        </button>
      )}
    </div>
  );
}
