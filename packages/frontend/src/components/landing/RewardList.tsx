// src/components/landing/RewardList.tsx
// Horizontal scrollable list of available rewards
'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { cn, getAssetUrl } from '@/lib/utils';
import type { RewardInfo } from '@/types/api.types';

interface RewardListProps {
  rewards: RewardInfo[];
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

export default function RewardList({ rewards, className }: RewardListProps) {
  if (!rewards || rewards.length === 0) return null;

  return (
    <section className={cn('w-full', className)}>
      <h3 className="text-lg font-bold text-gray-900 mb-3 px-1">
        🎁 Giải thưởng hấp dẫn
      </h3>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {rewards.map((reward) => (
          <RewardCard key={reward.id} reward={reward} />
        ))}
      </motion.div>
    </section>
  );
}

function RewardCard({ reward }: { reward: RewardInfo }) {
  const iconUrl = getAssetUrl(reward.icon);

  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        'flex-shrink-0 snap-center w-32',
        'bg-white rounded-xl border border-gray-100 shadow-sm',
        'p-3 text-center hover:shadow-md transition-shadow'
      )}
    >
      {/* Icon / Image */}
      <div className="w-14 h-14 mx-auto mb-2 rounded-lg bg-orange-50 flex items-center justify-center overflow-hidden">
        {iconUrl ? (
          <Image
            src={iconUrl}
            alt={reward.name}
            width={48}
            height={48}
            className="object-contain"
          />
        ) : (
          <span className="text-2xl">🎁</span>
        )}
      </div>

      {/* Name */}
      <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight">
        {reward.name}
      </p>

      {/* Description */}
      {reward.description && (
        <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">
          {reward.description}
        </p>
      )}
    </motion.div>
  );
}
