// src/hooks/games/useMemoryLogic.ts
// Memory card matching game logic
'use client';

import { useCallback, useRef, useState } from 'react';

export interface MemoryCardState {
  id: number;
  pairId: number;
  image: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface UseMemoryLogicOptions {
  gridSize: '3x3' | '4x4';
  cardImages: string[];
  matchesToWin: number;
  timeLimit: number;
  onWin?: (timeSpent: number, matchedPairs: number) => void;
  onLose?: (matchedPairs: number) => void;
}

/** Fisher-Yates shuffle */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function useMemoryLogic({
  gridSize,
  cardImages,
  matchesToWin,
  timeLimit,
  onWin,
  onLose,
}: UseMemoryLogicOptions) {
  const [cards, setCards] = useState<MemoryCardState[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [phase, setPhase] = useState<'idle' | 'peek' | 'playing' | 'won' | 'lost'>('idle');
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const startTimeRef = useRef(0);

  const totalCards = gridSize === '3x3' ? 8 : 16; // must be even for pairs

  // ── Initialize cards ───────────────────────────────────────────────
  const initCards = useCallback(() => {
    const pairsCount = totalCards / 2;
    // Use provided images or fallback emojis
    const defaultEmojis = ['🎁', '⭐', '🎄', '❤️', '🌟', '🎉', '🔔', '🎪'];
    const images = cardImages.length >= pairsCount
      ? cardImages.slice(0, pairsCount)
      : defaultEmojis.slice(0, pairsCount);

    const cardArray: MemoryCardState[] = [];
    for (let i = 0; i < pairsCount; i++) {
      cardArray.push(
        { id: i * 2, pairId: i, image: images[i], isFlipped: false, isMatched: false },
        { id: i * 2 + 1, pairId: i, image: images[i], isFlipped: false, isMatched: false }
      );
    }

    return shuffle(cardArray);
  }, [totalCards, cardImages]);

  // ── Start game ─────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    const newCards = initCards();
    setCards(newCards);
    setMatchedPairs(0);
    setFlippedIds([]);
    setIsChecking(false);
    setTimeLeft(timeLimit);

    // Peek phase: show all cards for 2s
    setPhase('peek');
    setCards(newCards.map((c) => ({ ...c, isFlipped: true })));

    setTimeout(() => {
      setCards((prev) => prev.map((c) => ({ ...c, isFlipped: false })));
      setPhase('playing');
      startTimeRef.current = Date.now();

      // Start timer
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            setPhase('lost');
            onLose?.(matchedPairs);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }, 2000);
  }, [initCards, timeLimit, matchedPairs, onLose]);

  // ── Flip a card ────────────────────────────────────────────────────
  const flipCard = useCallback(
    (cardId: number) => {
      if (phase !== 'playing' || isChecking) return;

      const card = cards.find((c) => c.id === cardId);
      if (!card || card.isFlipped || card.isMatched) return;
      if (flippedIds.length >= 2) return;

      // Flip it
      setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, isFlipped: true } : c)));
      const newFlipped = [...flippedIds, cardId];
      setFlippedIds(newFlipped);

      // If two cards flipped, check for match
      if (newFlipped.length === 2) {
        setIsChecking(true);
        const [firstId, secondId] = newFlipped;
        const first = cards.find((c) => c.id === firstId)!;
        const second = cards.find((c) => c.id === secondId)!;

        if (first.pairId === second.pairId) {
          // Match!
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                c.id === firstId || c.id === secondId
                  ? { ...c, isMatched: true }
                  : c
              )
            );
            const newMatched = matchedPairs + 1;
            setMatchedPairs(newMatched);
            setFlippedIds([]);
            setIsChecking(false);

            // Check win condition
            if (newMatched >= matchesToWin || newMatched >= totalCards / 2) {
              clearInterval(timerRef.current);
              const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
              setPhase('won');
              onWin?.(timeSpent, newMatched);
            }
          }, 300);
        } else {
          // No match — flip back
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                c.id === firstId || c.id === secondId
                  ? { ...c, isFlipped: false }
                  : c
              )
            );
            setFlippedIds([]);
            setIsChecking(false);
          }, 800);
        }
      }
    },
    [phase, isChecking, cards, flippedIds, matchedPairs, matchesToWin, totalCards, onWin]
  );

  // ── Cleanup ────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('idle');
    setCards([]);
    setMatchedPairs(0);
    setFlippedIds([]);
    setTimeLeft(timeLimit);
  }, [timeLimit]);

  return {
    cards,
    matchedPairs,
    timeLeft,
    phase,
    totalPairs: totalCards / 2,
    isChecking,
    startGame,
    flipCard,
    cleanup,
  };
}
