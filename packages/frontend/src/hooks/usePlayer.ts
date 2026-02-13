// src/hooks/usePlayer.ts
// Player registration and state management hook

'use client';

import { useCallback, useState } from 'react';
import { playerApi, gameApi } from '@/lib/api';
import { usePlayerStore } from '@/stores/playerStore';
import { useGameStore } from '@/stores/gameStore';
import type { RegisterPlayerInput, PlayResult, ApiError } from '@/types/api.types';

/**
 * Hook for player actions: register, play game, check eligibility.
 *
 * @returns Player state and action functions
 */
export function usePlayer() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    player,
    token,
    isRegistered,
    remainingPlays,
    maxPlays,
    setPlayer,
    setCampaignInfo,
    updatePlays,
    clearPlayer,
  } = usePlayerStore();

  const { setResult, setLoading: setGameLoading, setGameState } = useGameStore();

  /**
   * Register or login with phone number
   */
  const register = useCallback(
    async (input: RegisterPlayerInput): Promise<{ success: boolean; message: string }> => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, message } = await playerApi.register(input);

        // Store player and token
        setPlayer(data.player, data.token);

        // Set campaign info if available
        if (data.campaign) {
          setCampaignInfo(
            data.campaign.id,
            data.campaign.remainingPlays,
            data.campaign.maxPlays
          );
        }

        return { success: true, message: message ?? 'Đăng ký thành công!' };
      } catch (err) {
        const apiError = err as ApiError;
        const msg = apiError.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
        setError(msg);
        return { success: false, message: msg };
      } finally {
        setIsLoading(false);
      }
    },
    [setPlayer, setCampaignInfo]
  );

  /**
   * Play the game — calls backend and processes result
   */
  const playGame = useCallback(
    async (gameType: string): Promise<PlayResult | null> => {
      setGameLoading(true);
      setGameState('playing');
      setError(null);
      try {
        const { data } = await gameApi.play({
          gameType: gameType as PlayResult extends never ? never : string as never,
          gameData: undefined,
        } as never);

        // Update local state
        updatePlays(data.player.remainingPlays, data.player.totalWins);

        // Update game store with result
        setResult(data);

        return data;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Lỗi khi chơi game.');
        setGameState('idle');
        setGameLoading(false);
        return null;
      }
    },
    [updatePlays, setResult, setGameLoading, setGameState]
  );

  /**
   * Check if player can still play
   */
  const checkEligibility = useCallback(async () => {
    try {
      const data = await gameApi.checkEligibility();
      if (data) {
        usePlayerStore.setState({
          remainingPlays: data.remainingPlays,
          maxPlays: data.maxPlays,
        });
      }
      return data;
    } catch {
      return null;
    }
  }, []);

  return {
    // State
    player,
    token,
    isRegistered,
    remainingPlays,
    maxPlays,
    isLoading,
    error,

    // Actions
    register,
    playGame,
    checkEligibility,
    clearPlayer,
  };
}
