// src/components/games/MemoryGame/Card.tsx
// Flippable memory card with 3D CSS effect
'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { cn, getAssetUrl } from '@/lib/utils';

interface CardProps {
  image: string;
  isFlipped: boolean;
  isMatched: boolean;
  onClick: () => void;
  disabled?: boolean;
  size?: number;
}

export default function Card({
  image,
  isFlipped,
  isMatched,
  onClick,
  disabled,
  size = 72,
}: CardProps) {
  const imageUrl = getAssetUrl(image);
  const isEmoji = !image.startsWith('/') && !image.startsWith('http');

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || isFlipped || isMatched}
      whileTap={!isFlipped && !isMatched && !disabled ? { scale: 0.95 } : {}}
      className={cn(
        'perspective-800 relative touch-manipulation',
        'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 rounded-xl',
        isMatched && 'opacity-60',
      )}
      style={{ width: size, height: size }}
      aria-label={isFlipped ? image : 'Hidden card'}
    >
      <div
        className={cn(
          'preserve-3d relative w-full h-full transition-transform duration-500',
          (isFlipped || isMatched) && '[transform:rotateY(180deg)]',
        )}
      >
        {/* Front (hidden state) */}
        <div
          className={cn(
            'backface-hidden absolute inset-0 rounded-xl',
            'bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)]',
            'flex items-center justify-center shadow-sm',
            'border-2 border-white/30',
          )}
        >
          <span className="text-white text-xl font-bold">?</span>
        </div>

        {/* Back (revealed state) */}
        <div
          className={cn(
            'backface-hidden absolute inset-0 rounded-xl [transform:rotateY(180deg)]',
            'bg-white border-2 flex items-center justify-center shadow-sm',
            isMatched
              ? 'border-green-400 bg-green-50'
              : 'border-gray-200',
          )}
        >
          {isEmoji ? (
            <span className="text-3xl" style={{ fontSize: size * 0.45 }}>
              {image}
            </span>
          ) : imageUrl ? (
            <Image
              src={imageUrl}
              alt=""
              width={size * 0.6}
              height={size * 0.6}
              className="object-contain"
            />
          ) : (
            <span className="text-2xl">🎁</span>
          )}
        </div>
      </div>
    </motion.button>
  );
}
