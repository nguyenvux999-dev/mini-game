// src/validators/game.validator.ts
// Game API validation schemas

import { z } from 'zod';

/**
 * Valid game types
 */
export const GameTypeEnum = z.enum(['wheel', 'shake', 'memory', 'tap']);

/**
 * Game data for different game types (optional)
 */
const MemoryGameDataSchema = z.object({
  matchedPairs: z.number().int().min(0).optional(),
  timeSpent: z.number().min(0).optional(),
});

const TapGameDataSchema = z.object({
  taps: z.number().int().min(0).optional(),
  perfectHits: z.number().int().min(0).optional(),
});

const ShakeGameDataSchema = z.object({
  shakeCount: z.number().int().min(0).optional(),
});

const WheelGameDataSchema = z.object({
  // No specific data needed for wheel game
});

/**
 * Play game request schema
 */
export const playGameSchema = z.object({
  gameType: GameTypeEnum,
  gameData: z
    .union([
      MemoryGameDataSchema,
      TapGameDataSchema,
      ShakeGameDataSchema,
      WheelGameDataSchema,
      z.object({}), // Empty object allowed
    ])
    .optional(),
});

export type PlayGameInput = z.infer<typeof playGameSchema>;
