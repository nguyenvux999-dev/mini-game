// src/components/landing/FooterContact.tsx
// Footer with contact info and social links
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { ContactInfo, StoreInfo } from '@/types/api.types';

interface FooterContactProps {
  contact: ContactInfo | null;
  store: StoreInfo | null;
  className?: string;
}

export default function FooterContact({ contact, store, className }: FooterContactProps) {
  if (!contact) return null;

  const hasAnyLink = contact.hotline || contact.fanpage || contact.instagram || contact.zalo;
  const hasAddress = contact.address;

  if (!hasAnyLink && !hasAddress) return null;

  return (
    <footer className={cn('w-full safe-bottom', className)}>
      <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
        {/* Store Name */}
        <p className="text-sm font-semibold text-gray-700 text-center">
          {store?.name ?? 'Liên hệ'}
        </p>

        {/* Address */}
        {hasAddress && (
          <div className="flex items-start gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>{contact.address}</span>
          </div>
        )}

        {/* Hotline */}
        {contact.hotline && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            <a href={`tel:${contact.hotline}`} className="text-[var(--color-primary)] font-medium">
              {contact.hotline}
            </a>
          </div>
        )}

        {/* Social links row */}
        {(contact.fanpage || contact.instagram || contact.zalo) && (
          <div className="flex items-center justify-center gap-4 pt-1">
            {contact.fanpage && (
              <a
                href={contact.fanpage}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200 transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            )}

            {contact.instagram && (
              <a
                href={contact.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center hover:bg-pink-200 transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
            )}

            {contact.zalo && (
              <a
                href={contact.zalo}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center hover:bg-blue-200 transition-colors"
                aria-label="Zalo"
              >
                <span className="text-xs font-bold">Zalo</span>
              </a>
            )}
          </div>
        )}

        {/* Copyright */}
        <p className="text-[10px] text-gray-400 text-center pt-1">
          © {new Date().getFullYear()} {store?.name}. Powered by Web MiniGame
        </p>
      </div>
    </footer>
  );
}
