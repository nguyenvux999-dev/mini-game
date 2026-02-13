// src/app/page.tsx
// Landing Page — Entry point for players (mobile-first)
// Flow: Load config → Show brand/banner → Phone form → Register → Game → Result

'use client';

import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useConfig } from '@/hooks/useConfig';
import { usePlayer } from '@/hooks/usePlayer';
import { usePlayerStore } from '@/stores/playerStore';
import { useGameStore } from '@/stores/gameStore';
import { Loading } from '@/components/common';
import {
  BrandHeader,
  PromoBanner,
  PhoneForm,
  RewardList,
  FooterContact,
  PlayerToolbar,
  PlayerVoucherList,
} from '@/components/landing';
import { GameRenderer } from '@/components/games';
import { VoucherModal } from '@/components/voucher';
import { getStoreColorVars } from '@/lib/utils';
import type { RegisterPlayerInput } from '@/types/api.types';

export default function LandingPage() {
  const { store, campaign, rewards, contact, isLoading: configLoading, error: configError } = useConfig();
  const { register, isLoading: registerLoading } = usePlayer();
  const { isRegistered } = usePlayerStore();
  const { resetGame } = useGameStore();
  const [showVouchers, setShowVouchers] = useState(false);

  // ── Loading state ──────────────────────────────────────────────────
  if (configLoading) {
    return <Loading fullPage />;
  }

  // ── Error state ────────────────────────────────────────────────────
  if (configError) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-sm text-center space-y-3">
          <div className="text-5xl">😞</div>
          <h2 className="text-lg font-bold text-gray-900">Không thể tải trang</h2>
          <p className="text-sm text-gray-500">
            Vui lòng kiểm tra kết nối mạng và thử lại.
          </p>
        </div>
      </main>
    );
  }

  // ── No active campaign ─────────────────────────────────────────────
  if (!campaign) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4"
        style={store ? getStoreColorVars(store.primaryColor, store.secondaryColor) : undefined}
      >
        <div className="w-full max-w-sm text-center space-y-3">
          <div className="text-5xl">📋</div>
          <h2 className="text-lg font-bold text-gray-900">
            {store?.name ?? 'MiniGame'}
          </h2>
          <p className="text-sm text-gray-500">
            Hiện tại chưa có chương trình khuyến mãi nào đang diễn ra. Vui lòng quay lại sau!
          </p>
        </div>
      </main>
    );
  }

  // ── Handle registration ────────────────────────────────────────────
  const handleRegister = async (data: RegisterPlayerInput) => {
    return register(data);
  };

  // ── Handle voucher modal close ─────────────────────────────────────
  const handleResultClose = () => {
    resetGame();
  };

  // ── Apply dynamic store colors ─────────────────────────────────────
  const colorVars = store
    ? getStoreColorVars(store.primaryColor, store.secondaryColor)
    : undefined;

  return (
    <div className="min-h-screen bg-gray-50" style={colorVars}>
      {/* Sticky Header */}
      <BrandHeader store={store} campaign={campaign} />

      <main className="w-full max-w-md mx-auto px-4 pb-8">
        {/* Banner */}
        <PromoBanner store={store} campaign={campaign} className="mb-5" />

        {/* Rewards carousel */}
        {rewards.length > 0 && (
          <RewardList rewards={rewards} className="mb-5" />
        )}

        {/* Registration form — only shown when not registered */}
        {!isRegistered && (
          <PhoneForm
            onRegister={handleRegister}
            isLoading={registerLoading}
            className="mb-5"
          />
        )}

        {/* Player toolbar — shown when registered */}
        {isRegistered && (
          <PlayerToolbar
            showVouchers={showVouchers}
            onToggleVouchers={() => setShowVouchers((v) => !v)}
            className="mb-5"
          />
        )}

        {/* Player vouchers — collapsible */}
        <AnimatePresence>
          {isRegistered && showVouchers && (
            <PlayerVoucherList className="mb-5" />
          )}
        </AnimatePresence>

        {/* Game area */}
        <GameRenderer
          gameType={campaign.activeGame}
          rewards={rewards}
          campaign={campaign}
          className="mb-5"
        />

        {/* Footer contact */}
        <FooterContact contact={contact} store={store} className="mt-6" />
      </main>

      {/* Result modal (win / lose) */}
      <VoucherModal onClose={handleResultClose} />
    </div>
  );
}
