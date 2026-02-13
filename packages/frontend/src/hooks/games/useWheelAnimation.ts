// src/hooks/games/useWheelAnimation.ts
// Canvas-based wheel spin animation with easing
'use client';

import { useRef, useCallback, useState } from 'react';

export interface WheelSegmentData {
  id: number;
  label: string;
  color: string;
}

interface UseWheelAnimationOptions {
  segments: WheelSegmentData[];
  spinDuration?: number;
  /** Index of the target segment to land on (0-based) */
  onSpinEnd?: () => void;
}

// Easing function: decelerate (ease-out cubic)
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function useWheelAnimation({
  segments,
  spinDuration = 4000,
  onSpinEnd,
}: UseWheelAnimationOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const currentAngleRef = useRef(0);
  const isSpinningRef = useRef(false);
  const [isSpinning, setIsSpinning] = useState(false);

  const segmentCount = segments.length;
  const segmentAngle = (2 * Math.PI) / segmentCount;

  // ── Draw wheel on canvas ───────────────────────────────────────────
  const drawWheel = useCallback(
    (rotation: number) => {
      const canvas = canvasRef.current;
      if (!canvas || segmentCount === 0) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const size = canvas.clientWidth;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.scale(dpr, dpr);

      const cx = size / 2;
      const cy = size / 2;
      const radius = size / 2 - 4;

      ctx.clearRect(0, 0, size, size);

      // Draw segments
      for (let i = 0; i < segmentCount; i++) {
        const startAngle = rotation + i * segmentAngle - Math.PI / 2;
        const endAngle = startAngle + segmentAngle;

        // Segment fill
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = segments[i].color;
        ctx.fill();

        // Segment border
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label text
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(startAngle + segmentAngle / 2);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const fontSize = Math.max(10, Math.min(14, radius / 8));
        ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = '#fff';
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 2;

        // Truncate label
        const maxLen = 12;
        const label =
          segments[i].label.length > maxLen
            ? segments[i].label.slice(0, maxLen - 1) + '…'
            : segments[i].label;
        ctx.fillText(label, radius * 0.6, 0);
        ctx.restore();
      }

      // Center circle
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.12, 0, 2 * Math.PI);
      ctx.fillStyle = '#fff';
      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner ring
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.08, 0, 2 * Math.PI);
      ctx.fillStyle = 'var(--color-primary)';
      // fallback since canvas doesn't support CSS vars
      const primaryColor =
        getComputedStyle(document.documentElement)
          .getPropertyValue('--color-primary')
          .trim() || '#FF6B35';
      ctx.fillStyle = primaryColor;
      ctx.fill();
    },
    [segments, segmentCount, segmentAngle]
  );

  // ── Spin to target segment ─────────────────────────────────────────
  const spin = useCallback(
    (targetSegmentIndex: number) => {
      if (isSpinningRef.current || segmentCount === 0) return;
      
      isSpinningRef.current = true;
      setIsSpinning(true);

      // Cancel any running animation
      if (animationRef.current) cancelAnimationFrame(animationRef.current);

      const startAngle = currentAngleRef.current;
      // Spin at least 5 full rotations + land on target
      const fullRotations = 5 * 2 * Math.PI;
      // Target: center of the segment, aligned so pointer at top hits it
      const targetAngle =
        fullRotations +
        (2 * Math.PI - targetSegmentIndex * segmentAngle - segmentAngle / 2);

      const totalRotation = targetAngle;
      const startTime = performance.now();

      function animate(now: number) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / spinDuration, 1);
        const easedProgress = easeOutCubic(progress);

        const currentRotation = startAngle + totalRotation * easedProgress;
        currentAngleRef.current = currentRotation % (2 * Math.PI);

        drawWheel(currentRotation);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          isSpinningRef.current = false;
          setIsSpinning(false);
          onSpinEnd?.();
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    },
    [segmentCount, segmentAngle, spinDuration, drawWheel, onSpinEnd]
  );

  // ── Initial draw ───────────────────────────────────────────────────
  const initDraw = useCallback(() => {
    drawWheel(currentAngleRef.current);
  }, [drawWheel]);

  return {
    canvasRef,
    isSpinning,
    spin,
    initDraw,
    drawWheel,
  };
}
