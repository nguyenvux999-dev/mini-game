// src/components/voucher/QRDisplay.tsx
// QR code display - shows QR from backend (base64 or URL)
'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';

interface QRDisplayProps {
  value: string; // Base64 data URL or URL string
  size?: number;
  className?: string;
}

export default function QRDisplay({ value, size = 160, className }: QRDisplayProps) {
  // Check if value is base64 image or URL string
  const isBase64 = value.startsWith('data:');

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
        {isBase64 ? (
          // Display pre-generated base64 image
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={value}
            alt="QR Code"
            width={size}
            height={size}
            className="block"
          />
        ) : (
          // Generate QR from URL string
          <QRCodeSVG
            value={value}
            size={size}
            level="M"
            includeMargin={false}
            className="block"
          />
        )}
      </div>
      <p className="text-[10px] text-gray-400 mt-2">
        Quét mã QR để sử dụng voucher
      </p>
    </div>
  );
}
