// src/components/games/WheelGame/WheelCanvas.tsx
// Canvas-based wheel drawing component
'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useWheelAnimation, WheelSegmentData } from '@/hooks/games/useWheelAnimation';

interface WheelCanvasProps {
  segments: WheelSegmentData[];
  spinDuration?: number;
  targetIndex: number | null;
  spinning: boolean;
  onSpinEnd: () => void;
  className?: string;
}

export default function WheelCanvas({
  segments,
  spinDuration = 4000,
  targetIndex,
  spinning,
  onSpinEnd,
  className,
}: WheelCanvasProps) {
  const { canvasRef, isSpinning, spin, initDraw } = useWheelAnimation({
    segments,
    spinDuration,
    onSpinEnd,
  });

  // Initial draw
  useEffect(() => {
    initDraw();
  }, [initDraw]);

  // Trigger spin when targetIndex changes
  useEffect(() => {
    if (spinning && targetIndex !== null && !isSpinning) {
      spin(targetIndex);
    }
  }, [spinning, targetIndex, isSpinning, spin]);

  return (
    <div className={cn('relative w-full aspect-square', className)}>
      {/* Pointer triangle (top center) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
        <div
          className="w-0 h-0"
          style={{
            borderLeft: '12px solid transparent',
            borderRight: '12px solid transparent',
            borderTop: '20px solid var(--color-primary, #FF6B35)',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
          }}
        />
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-full"
        style={{ touchAction: 'none' }}
      />

      {/* Outer ring glow */}
      <div className="absolute inset-0 rounded-full pointer-events-none ring-4 ring-[var(--color-primary,#FF6B35)]/20" />
    </div>
  );
}
