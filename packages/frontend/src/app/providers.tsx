// src/app/providers.tsx
'use client';

import React from 'react';
import { SWRConfig } from 'swr';
import { ToastProvider } from '@/components/common/Toast';
import { swrFetcher } from '@/lib/api';

/**
 * Root providers wrapper — wraps the entire app with:
 * 1. SWR configuration (global fetcher, error handling)
 * 2. Toast notification system
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: swrFetcher,
        revalidateOnFocus: false,
        shouldRetryOnError: false,
        errorRetryCount: 2,
        dedupingInterval: 5000,
      }}
    >
      <ToastProvider>{children}</ToastProvider>
    </SWRConfig>
  );
}
