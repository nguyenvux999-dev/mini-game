// src/components/landing/BrandHeader.tsx
// Sticky header with store logo, name, and campaign title
'use client';

import React from 'react';
import Image from 'next/image';
import { cn, getAssetUrl } from '@/lib/utils';
import type { StoreInfo, CampaignInfo } from '@/types/api.types';

interface BrandHeaderProps {
  store: StoreInfo | null;
  campaign: CampaignInfo | null;
  className?: string;
}

export default function BrandHeader({ store, campaign, className }: BrandHeaderProps) {
  const logoUrl = getAssetUrl(store?.logo ?? null);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 border-b border-gray-100',
        'safe-top',
        className
      )}
    >
      <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
        {/* Store Logo */}
        {logoUrl ? (
          <div className="relative w-10 h-10 flex-shrink-0 rounded-full overflow-hidden border border-gray-200">
            <Image
              src={logoUrl}
              alt={store?.name ?? 'Logo'}
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
        ) : (
          <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-primary flex items-center justify-center">
            <span className="text-white text-lg font-bold">
              {store?.name?.charAt(0)?.toUpperCase() ?? '🎮'}
            </span>
          </div>
        )}

        {/* Store & Campaign Name */}
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-gray-900 truncate">
            {store?.name ?? 'MiniGame'}
          </h1>
          {campaign && (
            <p className="text-xs text-gray-500 truncate">
              {campaign.name}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
