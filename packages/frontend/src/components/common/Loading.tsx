// src/components/common/Loading.tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingProps {
  /** Full page overlay or inline */
  fullPage?: boolean;
  /** Loading text */
  text?: string;
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const spinnerSizes = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export default function Loading({
  fullPage = false,
  text,
  size = 'md',
  className,
}: LoadingProps) {
  const spinner = (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <svg
        className={cn('animate-spin text-[var(--color-primary,#FF6B35)]', spinnerSizes[size])}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
}

/** Skeleton placeholder for loading content */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-gray-200', className)}
    />
  );
}
