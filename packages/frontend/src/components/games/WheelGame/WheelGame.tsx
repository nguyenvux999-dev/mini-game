// src/components/games/WheelGame/WheelGame.tsx
// Wheel of Fortune game — spin the wheel and win prizes
'use client';

import React, { useCallback, useState, useMemo } from 'react';
import WheelCanvas from './WheelCanvas';
import { Button } from '@/components/common';
import { usePlayer } from '@/hooks/usePlayer';
import { useGameStore } from '@/stores/gameStore';
import { usePlayerStore } from '@/stores/playerStore';
import { cn } from '@/lib/utils';
import { resolveGameConfig } from '@/types/game.types';
import type { RewardInfo, CampaignInfo, PlayResult } from '@/types/api.types';
import type { WheelSegmentData } from '@/hooks/games/useWheelAnimation';

interface WheelGameProps {
  rewards: RewardInfo[];
  campaign: CampaignInfo;
  className?: string;
}

export default function WheelGame({ rewards, campaign, className }: WheelGameProps) {
  const { playGame } = usePlayer();
  const { remainingPlays } = usePlayerStore();
  const { gameState, isLoading, setGameState, closeResult, setResult } = useGameStore();

  const [spinning, setSpinning] = useState(false);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [pendingResult, setPendingResult] = useState<PlayResult | null>(null);

  // Resolve config from backend with safe defaults
  const config = useMemo(
    () => resolveGameConfig('wheel', campaign.gameConfig),
    [campaign.gameConfig],
  );

  const canPlay = remainingPlays > 0 && gameState !== 'playing' && gameState !== 'animating';

  // Build segments from rewards + a "Chúc bạn may mắn" (lose) segment
  const segments: WheelSegmentData[] = useMemo(() => {
    const segmentColors = config.colors;
    const segs: WheelSegmentData[] = rewards.map((r, i) => ({
      id: r.id,
      label: r.name,
      color: segmentColors[i % segmentColors.length],
    }));

    // Add a "try again" segment if we have fewer than 4
    if (segs.length < 6) {
      // Interleave "Chúc may mắn" segments
      const withLose: WheelSegmentData[] = [];
      segs.forEach((seg, i) => {
        withLose.push(seg);
        if (i < segs.length - 1 || segs.length < 4) {
          withLose.push({
            id: -(i + 1),
            label: 'Chúc may mắn',
            color: '#9CA3AF',
          });
        }
      });
      return withLose.length >= 4 ? withLose : segs;
    }

    return segs;
  }, [rewards, config]);

  // ── Handle play ────────────────────────────────────────────────────
  const handleSpin = useCallback(async () => {
    if (!canPlay || spinning) return;

    setGameState('playing');

    // Call API first to get result
    const result: PlayResult | null = await playGame('wheel');
    if (!result) {
      setGameState('idle');
      return;
    }

    // Store result for later (after animation)
    setPendingResult(result);
    // Close the modal that playGame opened immediately
    closeResult();

    // Find target segment index
    let targetIdx = 0;
    if (result.isWin && result.reward) {
      const rewardIdx = segments.findIndex((s) => s.id === result.reward!.id);
      targetIdx = rewardIdx >= 0 ? rewardIdx : 0;
    } else {
      // Land on a "lose" segment
      const loseIdx = segments.findIndex((s) => s.id < 0);
      targetIdx = loseIdx >= 0 ? loseIdx : 0;
    }

    // Start spin animation
    setTargetIndex(targetIdx);
    setSpinning(true);
    setGameState('animating');
  }, [canPlay, spinning, playGame, segments, setGameState, closeResult]);

  // ── Spin ended ─────────────────────────────────────────────────────
  const handleSpinEnd = useCallback(() => {
    setSpinning(false);
    setTargetIndex(null);
    
    // Now show the result modal after animation
    if (pendingResult) {
      setResult(pendingResult);
      setPendingResult(null);
    }
  }, [pendingResult, setResult]);

  return (
    <div className={cn('w-full game-active', className)}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Wheel area */}
        <div className="relative p-4 pb-2 flex justify-center">
          <div className="w-full max-w-[300px]">
            <WheelCanvas
              segments={segments}
              spinDuration={config.spinDuration}
              targetIndex={targetIndex}
              spinning={spinning}
              onSpinEnd={handleSpinEnd}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 space-y-3">
          {/* Play status */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Lượt chơi còn lại</span>
            <span className="font-bold text-[var(--color-primary)]">
              {remainingPlays}
            </span>
          </div>

          <Button
            fullWidth
            size="lg"
            onClick={handleSpin}
            loading={isLoading}
            disabled={!canPlay || spinning}
          >
            {spinning ? '🎡 Đang quay...' : canPlay ? '🎡 Quay ngay!' : '😔 Hết lượt'}
          </Button>
        </div>
      </div>
    </div>
  );
}
