// src/hooks/games/useTapCounter.ts
// Tap counting and timing logic for tap-based games
'use client';

import { useRef, useCallback, useState } from 'react';

interface UseTapCounterOptions {
  timeLimit: number; // seconds
  onTimeUp?: (tapCount: number) => void;
}

export function useTapCounter({ timeLimit, onTimeUp }: UseTapCounterOptions) {
  const [tapCount, setTapCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const startTimeRef = useRef(0);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;
  const tapCountRef = useRef(0);

  const start = useCallback(() => {
    setTapCount(0);
    tapCountRef.current = 0;
    setTimeLeft(timeLimit);
    setIsActive(true);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, timeLimit - elapsed);
      setTimeLeft(Math.ceil(remaining));

      if (remaining <= 0) {
        clearInterval(timerRef.current);
        setIsActive(false);
        onTimeUpRef.current?.(tapCountRef.current);
      }
    }, 100);
  }, [timeLimit]);

  const tap = useCallback(() => {
    if (!isActive) return;
    tapCountRef.current += 1;
    setTapCount(tapCountRef.current);
  }, [isActive]);

  const stop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
  }, []);

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTapCount(0);
    tapCountRef.current = 0;
    setTimeLeft(timeLimit);
    setIsActive(false);
  }, [timeLimit]);

  return {
    tapCount,
    timeLeft,
    isActive,
    start,
    tap,
    stop,
    reset,
    /** Progress 0-1 based on time elapsed */
    timeProgress: isActive ? (timeLimit - timeLeft) / timeLimit : 0,
  };
}
