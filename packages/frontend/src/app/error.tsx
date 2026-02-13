// src/app/error.tsx
// Global error boundary for the landing page
'use client';

import React from 'react';
import { Button } from '@/components/common';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: ErrorPageProps) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm text-center space-y-4">
        {/* Error icon */}
        <div className="text-5xl">⚠️</div>

        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Đã xảy ra lỗi
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {error.message || 'Không thể tải trang. Vui lòng thử lại.'}
          </p>
        </div>

        <Button onClick={reset} fullWidth>
          Thử lại
        </Button>
      </div>
    </main>
  );
}
