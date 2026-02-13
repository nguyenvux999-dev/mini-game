// src/hooks/games/useShakeDetect.ts
// DeviceMotion API shake detection with desktop fallback
'use client';

import { useRef, useCallback, useState, useEffect } from 'react';

interface UseShakeDetectOptions {
  /** Acceleration threshold to detect a shake (m/s²) */
  threshold?: number;
  /** Minimum interval between shake events (ms) */
  debounceMs?: number;
  /** Whether detection is active */
  enabled?: boolean;
  onShake?: () => void;
}

export function useShakeDetect({
  threshold = 12,
  debounceMs = 300,
  enabled = false,
  onShake,
}: UseShakeDetectOptions = {}) {
  const [shakeCount, setShakeCount] = useState(0);
  const [hasMotionSupport, setHasMotionSupport] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const lastShakeTime = useRef(0);
  const onShakeRef = useRef(onShake);
  onShakeRef.current = onShake;

  // Check DeviceMotion availability
  useEffect(() => {
    const supported = 'DeviceMotionEvent' in window;
    setHasMotionSupport(supported);
  }, []);

  // Request permission (iOS 13+)
  const requestPermission = useCallback(async (): Promise<boolean> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DME = DeviceMotionEvent as any;
    if (typeof DME.requestPermission === 'function') {
      try {
        const response = await DME.requestPermission();
        const granted = response === 'granted';
        setPermissionGranted(granted);
        return granted;
      } catch {
        setPermissionGranted(false);
        return false;
      }
    }
    // Non-iOS or older: permission not needed
    setPermissionGranted(true);
    return true;
  }, []);

  // DeviceMotion handler
  const handleMotion = useCallback(
    (event: DeviceMotionEvent) => {
      if (!enabled) return;

      const acc = event.accelerationIncludingGravity;
      if (!acc) return;

      const x = acc.x ?? 0;
      const y = acc.y ?? 0;
      const z = acc.z ?? 0;
      const magnitude = Math.sqrt(x * x + y * y + z * z);

      if (magnitude > threshold) {
        const now = Date.now();
        if (now - lastShakeTime.current > debounceMs) {
          lastShakeTime.current = now;
          setShakeCount((c) => c + 1);
          onShakeRef.current?.();
        }
      }
    },
    [enabled, threshold, debounceMs]
  );

  // Attach / detach listener
  useEffect(() => {
    if (!enabled || !hasMotionSupport || !permissionGranted) return;

    window.addEventListener('devicemotion', handleMotion);
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [enabled, hasMotionSupport, permissionGranted, handleMotion]);

  // Manual shake (desktop fallback)
  const triggerShake = useCallback(() => {
    if (!enabled) return;
    setShakeCount((c) => c + 1);
    onShakeRef.current?.();
  }, [enabled]);

  // Reset
  const resetShakes = useCallback(() => {
    setShakeCount(0);
  }, []);

  return {
    shakeCount,
    hasMotionSupport,
    permissionGranted,
    requestPermission,
    triggerShake,
    resetShakes,
  };
}
