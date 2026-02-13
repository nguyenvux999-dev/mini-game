// src/hooks/useAuth.ts
// Admin authentication hook

'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAdminStore } from '@/stores/adminStore';
import type { LoginInput, ApiError } from '@/types/api.types';

/**
 * Hook for admin authentication: login, logout, session check.
 */
export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const { admin, isAuthenticated, setAdmin, clearAdmin } = useAdminStore();

  /**
   * Login with username and password
   */
  const login = useCallback(
    async (input: LoginInput): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await authApi.login(input);
        setAdmin(data.admin, data.token);
        router.push('/admin');
        return true;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Đăng nhập thất bại.');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [setAdmin, router]
  );

  /**
   * Logout and redirect to login page
   */
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    } finally {
      clearAdmin();
      router.push('/admin/login');
    }
  }, [clearAdmin, router]);

  /**
   * Verify current session is valid
   */
  const verifySession = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated) return false;
    try {
      const adminData = await authApi.getMe();
      useAdminStore.setState({ admin: adminData });
      return true;
    } catch {
      clearAdmin();
      return false;
    }
  }, [isAuthenticated, clearAdmin]);

  return {
    admin,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    verifySession,
  };
}
