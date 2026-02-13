// src/lib/utils.ts
// Utility functions

import { clsx, type ClassValue } from 'clsx';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Format date to Vietnamese locale
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  });
}

/**
 * Format datetime to Vietnamese locale
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Obfuscate phone number: 0909123456 → 0909***456
 */
export function obfuscatePhone(phone: string): string {
  if (phone.length < 7) return phone;
  return phone.slice(0, 4) + '***' + phone.slice(-3);
}

/**
 * Format number with thousand separators (Vietnamese style)
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('vi-VN').format(num);
}

/**
 * Format currency (VND)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

/**
 * Check if a date string is expired
 */
export function isExpired(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

/**
 * Get relative time (e.g., "2 ngày trước")
 */
export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 30) return `${diffDays} ngày trước`;
  return formatDate(d);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Delay/sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Build full asset URL from relative path
 */
export function getAssetUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}

/**
 * Generate CSS custom properties from store colors
 */
export function getStoreColorVars(primaryColor: string, secondaryColor: string) {
  return {
    '--color-primary': primaryColor,
    '--color-secondary': secondaryColor,
  } as React.CSSProperties;
}
