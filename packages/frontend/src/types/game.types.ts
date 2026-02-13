// src/types/game.types.ts
// Game-specific type definitions

import { GameType } from './api.types';

// ============================================================================
// WHEEL GAME
// ============================================================================

export interface WheelConfig {
  /** Number of segments on the wheel */
  segments: number;
  /** Colors for each segment (hex) */
  colors: string[];
  /** Duration of spin in ms */
  spinDuration: number;
  /** Pointer position */
  pointer: 'top' | 'right';
}

export interface WheelSegment {
  id: number;
  label: string;
  icon: string | null;
  color: string;
}

// ============================================================================
// SHAKE GAME
// ============================================================================

export interface ShakeConfig {
  /** Visual theme */
  theme: 'tree' | 'santa' | 'firework';
  /** Sensitivity threshold for device motion */
  shakeSensitivity: number;
  /** Game duration in seconds */
  duration: number;
  /** Falling object image URL (from game_assets) */
  fallingObject: string;
  /** Background image URL (from game_assets) */
  background: string;
}

// ============================================================================
// MEMORY GAME
// ============================================================================

export interface MemoryConfig {
  /** Card grid layout */
  gridSize: '3x3' | '4x4';
  /** Card back images (URLs) */
  cardImages: string[];
  /** Time limit in seconds */
  timeLimit: number;
  /** Pairs needed to win */
  matchesToWin: number;
}

// ============================================================================
// TAP GAME
// ============================================================================

export type TapVariant = 'cooking' | 'eating';

export interface TapConfig {
  /** Game variant */
  variant: TapVariant;
  /** Cooking: number of perfect zones */
  perfectZones: number;
  /** Eating: target taps needed */
  targetTaps: number;
  /** Time limit in seconds */
  timeLimit: number;
  /** Character image URL (from game_assets) */
  character: string;
  /** Target item image URL (from game_assets) */
  targetItem: string;
}

// ============================================================================
// CONFIG MAP & DEFAULTS
// ============================================================================

/** Map from GameType → its config shape */
export interface GameConfigMap {
  wheel: WheelConfig;
  shake: ShakeConfig;
  memory: MemoryConfig;
  tap: TapConfig;
}

/** Default configs used when admin hasn't customized */
export const DEFAULT_GAME_CONFIGS: GameConfigMap = {
  wheel: {
    segments: 8,
    colors: ['#FF6B35', '#F7C59F', '#2EC4B6', '#E71D36', '#3B82F6', '#A855F7', '#EC4899', '#F59E0B'],
    spinDuration: 4000,
    pointer: 'top',
  },
  shake: {
    theme: 'tree',
    shakeSensitivity: 12,
    duration: 10,
    fallingObject: '',
    background: '',
  },
  memory: {
    gridSize: '4x4',
    cardImages: [],
    timeLimit: 60,
    matchesToWin: 6,
  },
  tap: {
    variant: 'eating',
    perfectZones: 3,
    targetTaps: 50,
    timeLimit: 10,
    character: '',
    targetItem: '',
  },
};

/**
 * Merge raw gameConfig from backend with defaults for a given game type.
 * Handles both wrapped format { "wheel": { ... } } and flat format { segments: 8, ... }.
 * Ensures every field has a valid value even if admin saved partial config.
 */
export function resolveGameConfig<T extends GameType>(
  gameType: T,
  raw: Record<string, unknown> | string | null | undefined,
): GameConfigMap[T] {
  const defaults = DEFAULT_GAME_CONFIGS[gameType];
  if (!raw) return { ...defaults };

  // If raw is a JSON string, parse it
  let parsed: Record<string, unknown>;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ...defaults };
    }
  } else {
    parsed = raw;
  }

  // Check if wrapped format: { "wheel": { ... } }
  if (parsed[gameType] && typeof parsed[gameType] === 'object' && !Array.isArray(parsed[gameType])) {
    return { ...defaults, ...(parsed[gameType] as Record<string, unknown>) } as GameConfigMap[T];
  }

  // Flat format: { segments: 8, ... }
  return { ...defaults, ...parsed } as GameConfigMap[T];
}

// ============================================================================
// COMMON GAME TYPES
// ============================================================================

/** Union of all game configs */
export type GameConfig = WheelConfig | ShakeConfig | MemoryConfig | TapConfig;

/** Game state machine */
export type GameState = 'idle' | 'ready' | 'playing' | 'animating' | 'finished';

/** Game result shown on UI */
export interface GameUIResult {
  isWin: boolean;
  rewardName: string | null;
  rewardIcon: string | null;
  voucherCode: string | null;
  qrCode: string | null;
  expiresAt: string | null;
  remainingPlays: number;
}

/** Props common to all game components */
export interface BaseGameProps {
  gameType: GameType;
  rewards: Array<{
    id: number;
    name: string;
    icon: string | null;
  }>;
  onPlay: () => Promise<void>;
  onComplete: (result: GameUIResult) => void;
  disabled?: boolean;
}
