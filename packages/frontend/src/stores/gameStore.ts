// src/stores/gameStore.ts
// Zustand store for game state management

import { create } from 'zustand';
import type { GameType, PlayResult } from '@/types/api.types';
import type { GameState, GameUIResult } from '@/types/game.types';

interface GameStoreState {
  // ── State ────────────────────────────────────────────────────────────────
  /** Current game type from active campaign */
  gameType: GameType | null;
  /** Current game state machine */
  gameState: GameState;
  /** Last play result */
  lastResult: GameUIResult | null;
  /** Whether the result modal is open */
  showResult: boolean;
  /** Loading state for API calls */
  isLoading: boolean;

  // ── Actions ──────────────────────────────────────────────────────────────

  /** Set the active game type */
  setGameType: (type: GameType) => void;

  /** Transition game state */
  setGameState: (state: GameState) => void;

  /** Set play result and show modal */
  setResult: (result: PlayResult) => void;

  /** Close result modal */
  closeResult: () => void;

  /** Set loading */
  setLoading: (loading: boolean) => void;

  /** Reset game to idle */
  resetGame: () => void;
}

export const useGameStore = create<GameStoreState>()((set) => ({
  // Initial state
  gameType: null,
  gameState: 'idle',
  lastResult: null,
  showResult: false,
  isLoading: false,

  // Actions
  setGameType: (type) => set({ gameType: type }),

  setGameState: (state) => set({ gameState: state }),

  setResult: (result) =>
    set({
      lastResult: {
        isWin: result.isWin,
        rewardName: result.reward?.name ?? null,
        rewardIcon: result.reward?.icon ?? null,
        voucherCode: result.voucher?.code ?? null,
        qrCode: result.voucher?.qrCode ?? null,
        expiresAt: result.voucher?.expiresAt ?? null,
        remainingPlays: result.player.remainingPlays,
      },
      showResult: true,
      gameState: 'finished',
      isLoading: false,
    }),

  closeResult: () => set({ showResult: false }),

  setLoading: (loading) => set({ isLoading: loading }),

  resetGame: () =>
    set({
      gameState: 'idle',
      lastResult: null,
      showResult: false,
      isLoading: false,
    }),
}));
