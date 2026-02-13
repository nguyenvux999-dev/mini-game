// src/stores/playerStore.ts
// Zustand store for player state management

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Player } from '@/types/api.types';
import { STORAGE_KEYS } from '@/lib/constants';

interface PlayerState {
  // ── State ────────────────────────────────────────────────────────────────
  player: Player | null;
  token: string | null;
  campaignId: number | null;
  remainingPlays: number;
  maxPlays: number;
  isRegistered: boolean;

  // ── Actions ──────────────────────────────────────────────────────────────

  /** Set player data after registration/login */
  setPlayer: (player: Player, token: string) => void;

  /** Set campaign play info */
  setCampaignInfo: (campaignId: number, remainingPlays: number, maxPlays: number) => void;

  /** Update remaining plays after game */
  updatePlays: (remainingPlays: number, totalWins: number) => void;

  /** Clear all player data (logout) */
  clearPlayer: () => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      // Initial state
      player: null,
      token: null,
      campaignId: null,
      remainingPlays: 0,
      maxPlays: 0,
      isRegistered: false,

      // Actions
      setPlayer: (player, token) => {
        // Also store token in localStorage for API client
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.PLAYER_TOKEN, token);
        }
        set({
          player,
          token,
          isRegistered: true,
        });
      },

      setCampaignInfo: (campaignId, remainingPlays, maxPlays) => {
        set({ campaignId, remainingPlays, maxPlays });
      },

      updatePlays: (remainingPlays, totalWins) => {
        set((state) => ({
          remainingPlays,
          player: state.player
            ? { ...state.player, totalWins, playCount: state.player.playCount + 1 }
            : null,
        }));
      },

      clearPlayer: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEYS.PLAYER_TOKEN);
        }
        set({
          player: null,
          token: null,
          campaignId: null,
          remainingPlays: 0,
          maxPlays: 0,
          isRegistered: false,
        });
      },
    }),
    {
      name: STORAGE_KEYS.PLAYER_DATA,
      partialize: (state) => ({
        player: state.player,
        token: state.token,
        campaignId: state.campaignId,
        remainingPlays: state.remainingPlays,
        maxPlays: state.maxPlays,
        isRegistered: state.isRegistered,
      }),
    }
  )
);
