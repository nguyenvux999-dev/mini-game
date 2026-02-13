// src/components/landing/PromoBanner.tsx
// Hero banner image with fallback gradient
'use client';

import React from 'react';
import Image from 'next/image';
import { cn, getAssetUrl } from '@/lib/utils';
import type { StoreInfo, CampaignInfo } from '@/types/api.types';

interface PromoBannerProps {
  store: StoreInfo | null;
  campaign: CampaignInfo | null;
  className?: string;
}

export default function PromoBanner({ store, campaign, className }: PromoBannerProps) {
  const bannerUrl = getAssetUrl(store?.banner ?? null);

  return (
    <section className={cn('w-full', className)}>
      {bannerUrl ? (
        <div className="relative w-full h-48 sm:h-56 overflow-hidden rounded-lg shadow-sm">
          <Image
            src={bannerUrl}
            alt={campaign?.name ?? 'Khuyến mãi'}
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 448px"
            priority
          />
          {/* Gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white/60 to-transparent" />
        </div>
      ) : (
        /* Fallback gradient banner */
        <div className="relative w-full h-48 sm:h-56 bg-gradient-primary flex items-center justify-center overflow-hidden rounded-lg shadow-sm">
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-white/10" />

          <div className="text-center px-6 relative z-10">
            <h2 className="text-2xl font-bold text-white mb-1">
              {campaign?.name ?? '🎮 Chơi Game Trúng Thưởng'}
            </h2>
            {campaign?.description && (
              <p className="text-sm text-white/80 line-clamp-2">
                {campaign.description}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
