// src/stores/adminStore.ts
// Zustand store for admin authentication & state

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminUser } from '@/types/api.types';
import { STORAGE_KEYS } from '@/lib/constants';

interface AdminState {
  // ── State ────────────────────────────────────────────────────────────────
  admin: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;

  // ── Actions ──────────────────────────────────────────────────────────────

  /** Set admin data after login */
  setAdmin: (admin: AdminUser, token: string) => void;

  /** Update admin profile */
  updateAdmin: (admin: Partial<AdminUser>) => void;

  /** Clear admin session (logout) */
  clearAdmin: () => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      admin: null,
      token: null,
      isAuthenticated: false,

      setAdmin: (admin, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, token);
        }
        set({ admin, token, isAuthenticated: true });
      },

      updateAdmin: (updates) => {
        set((state) => ({
          admin: state.admin ? { ...state.admin, ...updates } : null,
        }));
      },

      clearAdmin: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
        }
        set({ admin: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'minigame_admin_data',
      partialize: (state) => ({
        admin: state.admin,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
