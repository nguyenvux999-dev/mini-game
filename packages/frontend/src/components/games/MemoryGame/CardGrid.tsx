// src/components/games/MemoryGame/CardGrid.tsx
// Grid layout for memory cards (3x3 or 4x4)
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Card from './Card';
import { cn } from '@/lib/utils';
import type { MemoryCardState } from '@/hooks/games/useMemoryLogic';

interface CardGridProps {
  cards: MemoryCardState[];
  gridSize: '3x3' | '4x4';
  disabled: boolean;
  onCardClick: (cardId: number) => void;
  className?: string;
}

export default function CardGrid({
  cards,
  gridSize,
  disabled,
  onCardClick,
  className,
}: CardGridProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'grid gap-2 w-fit mx-auto',
        gridSize === '3x3' ? 'grid-cols-3' : 'grid-cols-4',
        className,
      )}
      style={{
        // Ensure cards stay square on mobile
        maxWidth: gridSize === '3x3' ? 280 : 320,
      }}
    >
      {cards.map((card, i) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.03 }}
        >
          <Card
            image={card.image}
            isFlipped={card.isFlipped}
            isMatched={card.isMatched}
            onClick={() => onCardClick(card.id)}
            disabled={disabled}
            size={gridSize === '3x3' ? 84 : 68}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
