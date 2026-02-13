// src/components/common/Toast.tsx
'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// ── Toast types ──────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

// ── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (type: ToastType, message: string, duration = 4000) => {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, type, message, duration }]);

      // Auto-remove
      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

// ── Container ────────────────────────────────────────────────────────────────

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── Individual toast ─────────────────────────────────────────────────────────

const typeStyles: Record<ToastType, { bg: string; icon: string }> = {
  success: { bg: 'bg-green-50 border-green-200 text-green-800', icon: '✓' },
  error: { bg: 'bg-red-50 border-red-200 text-red-800', icon: '✕' },
  warning: { bg: 'bg-yellow-50 border-yellow-200 text-yellow-800', icon: '⚠' },
  info: { bg: 'bg-blue-50 border-blue-200 text-blue-800', icon: 'ℹ' },
};

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const style = typeStyles[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      className={cn(
        'pointer-events-auto flex items-start gap-3 p-3 rounded-lg border shadow-lg',
        style.bg
      )}
    >
      <span className="text-lg font-bold flex-shrink-0">{style.icon}</span>
      <p className="text-sm flex-1">{toast.message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
}
