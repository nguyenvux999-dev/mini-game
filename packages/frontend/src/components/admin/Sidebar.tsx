// src/components/admin/Sidebar.tsx
// Admin sidebar navigation with collapse on mobile
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/config', label: 'Cấu hình', icon: '⚙️' },
  { href: '/admin/campaigns', label: 'Chiến dịch', icon: '🎯' },
  { href: '/admin/rewards', label: 'Phần thưởng', icon: '🎁' },
  { href: '/admin/vouchers', label: 'Voucher', icon: '🎫' },
  { href: '/admin/players', label: 'Người chơi', icon: '👥' },
  { href: '/admin/assets', label: 'Tài nguyên', icon: '🖼️' },
  { href: '/admin/scan', label: 'Quét QR', icon: '📷' },
  { href: '/admin/stats', label: 'Thống kê', icon: '📈' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-60 bg-white border-r border-gray-200 transition-transform duration-200 ease-in-out',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-gray-100 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white text-lg">
            🎮
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-gray-900 truncate">MiniGame</h2>
            <p className="text-[10px] text-gray-400">Admin Panel</p>
          </div>
          {/* Close button (mobile) */}
          <button
            onClick={onClose}
            className="ml-auto lg:hidden text-gray-400 hover:text-gray-600 p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-64px)]">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive(item.href)
                  ? 'bg-orange-50 text-orange-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span>{item.label}</span>
              {isActive(item.href) && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500" />
              )}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
