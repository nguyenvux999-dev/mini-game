// src/app/admin/layout.tsx
// Admin Layout — Protected layout with Sidebar + TopBar
'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminStore } from '@/stores/adminStore';
import { Sidebar, TopBar } from '@/components/admin';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useAdminStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Wait for zustand hydration before checking auth
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Login page doesn't need sidebar/topbar
  const isLoginPage = pathname === '/admin/login';

  // Redirect to login if not authenticated (after hydration)
  useEffect(() => {
    if (hydrated && !isAuthenticated && !isLoginPage) {
      router.replace('/admin/login');
    }
  }, [hydrated, isAuthenticated, isLoginPage, router]);

  // Login page: render children directly (no sidebar)
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Before hydration: show loading shell
  if (!hydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Not authenticated: show nothing while redirecting
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="flex flex-col min-h-screen lg:ml-60">
        {/* TopBar */}
        <TopBar onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
