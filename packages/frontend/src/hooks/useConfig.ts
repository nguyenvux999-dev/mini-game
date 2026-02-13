// src/hooks/useConfig.ts
// Fetch and cache store configuration with SWR

'use client';

import useSWR from 'swr';
import { swrFetcher } from '@/lib/api';
import { SWR_KEYS } from '@/lib/constants';
import type { PublicConfig } from '@/types/api.types';

/**
 * Hook to fetch public configuration (store, campaign, rewards, contact).
 * Uses SWR for automatic caching and revalidation.
 *
 * @returns { config, isLoading, error, mutate }
 */
export function useConfig() {
  const { data, error, isLoading, mutate } = useSWR<PublicConfig>(
    SWR_KEYS.CONFIG,
    swrFetcher,
    {
      // Config changes rarely — revalidate every 5 minutes
      revalidateOnFocus: false,
      refreshInterval: 5 * 60 * 1000,
      dedupingInterval: 60 * 1000,
    }
  );

  return {
    config: data ?? null,
    store: data?.store ?? null,
    campaign: data?.campaign ?? null,
    rewards: data?.rewards ?? [],
    contact: data?.contact ?? null,
    isLoading,
    error: error ?? null,
    mutate,
  };
}
