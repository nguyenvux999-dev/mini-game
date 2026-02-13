// src/components/games/ShakeGame/FallingObjects.tsx
// Animated falling particles with theme support + custom image
'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type ShakeTheme = 'tree' | 'santa' | 'firework';

const THEME_EMOJIS: Record<ShakeTheme, string[]> = {
  tree: ['🍃', '🌿', '🍂', '🍁', '🌸', '💚'],
  santa: ['🎁', '⭐', '❄️', '🎄', '🔔', '🎅'],
  firework: ['🎊', '✨', '🎉', '💫', '⭐', '🌟'],
};

interface FallingObject {
  id: number;
  emoji: string;
  x: number;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
}

interface FallingObjectsProps {
  theme: ShakeTheme;
  /** Number of particles currently generated */
  count: number;
  active: boolean;
  /** Custom image URL from game_assets — if set, used instead of emojis */
  customImage?: string | null;
}

export default function FallingObjects({ theme, count, active, customImage }: FallingObjectsProps) {
  const emojis = THEME_EMOJIS[theme] || THEME_EMOJIS.tree;

  const objects: FallingObject[] = useMemo(() => {
    return Array.from({ length: Math.min(count, 40) }, (_, i) => ({
      id: i,
      emoji: emojis[i % emojis.length],
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 1.5 + Math.random() * 1.5,
      size: 16 + Math.random() * 16,
      rotation: Math.random() * 360,
    }));
  }, [count, emojis]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      <AnimatePresence>
        {active &&
          objects.map((obj) => (
            <motion.div
              key={`${obj.id}-${count}`}
              initial={{
                x: `${obj.x}vw`,
                y: '-10%',
                rotate: 0,
                opacity: 1,
                scale: 0.5,
              }}
              animate={{
                y: '110%',
                rotate: obj.rotation,
                opacity: [1, 1, 0.5, 0],
                scale: [0.5, 1, 0.8],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: obj.duration,
                delay: obj.delay,
                ease: 'easeIn',
              }}
              className="absolute"
              style={{ fontSize: customImage ? undefined : obj.size, left: `${obj.x}%` }}
            >
              {customImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={customImage}
                  alt=""
                  style={{ width: obj.size + 8, height: obj.size + 8 }}
                  className="object-contain"
                />
              ) : (
                obj.emoji
              )}
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
}
