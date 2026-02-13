// src/types/index.ts
// Central type exports

export type * from './api.types';
export type {
  WheelConfig,
  WheelSegment,
  ShakeConfig,
  MemoryConfig,
  TapConfig,
  TapVariant,
  GameConfig,
  GameConfigMap,
  GameState,
  GameUIResult,
  BaseGameProps,
} from './game.types';

export { DEFAULT_GAME_CONFIGS, resolveGameConfig } from './game.types';

// Re-export ERROR_CODES as value
export { ERROR_CODES } from './api.types';
