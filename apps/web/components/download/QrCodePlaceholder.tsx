'use client';

import React from 'react';
import { Smartphone, QrCode as QrIcon } from 'lucide-react';

export interface QrCodePlaceholderProps {
  platform: 'android' | 'ios' | 'universal';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const QrCodePlaceholder: React.FC<QrCodePlaceholderProps> = ({
  platform,
  label,
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-28 h-28',
    md: 'w-36 h-36',
    lg: 'w-44 h-44',
  };

  const platformTitle =
    platform === 'android'
      ? 'Android (Google Play)'
      : platform === 'ios'
      ? 'iOS (App Store)'
      : 'Universal Store Scan';

  return (
    <div
      className={`p-4 rounded-2xl bg-white text-neutral-900 flex flex-col items-center text-center shadow-xl border border-white/20 select-none ${className}`}
    >
      <div
        className={`relative ${sizeMap[size]} bg-neutral-900 rounded-xl p-2.5 flex items-center justify-center overflow-hidden`}
      >
        {/* Geometric QR Simulation Grid */}
        <div className="w-full h-full bg-white p-2 rounded-lg grid grid-cols-7 grid-rows-7 gap-0.5">
          {/* Top-left position marker */}
          <div className="col-span-2 row-span-2 bg-black rounded-sm p-0.5">
            <div className="w-full h-full bg-white p-0.5">
              <div className="w-full h-full bg-black rounded-sm" />
            </div>
          </div>
          <div className="col-span-3 row-span-1 bg-black rounded-sm" />
          {/* Top-right position marker */}
          <div className="col-span-2 row-span-2 bg-black rounded-sm p-0.5">
            <div className="w-full h-full bg-white p-0.5">
              <div className="w-full h-full bg-black rounded-sm" />
            </div>
          </div>

          <div className="col-span-1 row-span-3 bg-black rounded-sm" />
          {/* Center Brand Icon Accent */}
          <div className="col-span-3 row-span-3 bg-popo-pink/20 border border-popo-pink/40 rounded-md flex items-center justify-center p-0.5">
            <div className="w-4 h-4 rounded-full bg-popo-pink flex items-center justify-center text-[8px] font-black text-white">
              P
            </div>
          </div>
          <div className="col-span-1 row-span-3 bg-black rounded-sm" />

          {/* Bottom-left position marker */}
          <div className="col-span-2 row-span-2 bg-black rounded-sm p-0.5">
            <div className="w-full h-full bg-white p-0.5">
              <div className="w-full h-full bg-black rounded-sm" />
            </div>
          </div>
          <div className="col-span-3 row-span-1 bg-black rounded-sm" />
          <div className="col-span-2 row-span-2 bg-black rounded-sm" />
        </div>

        {/* QR Overlay Badge */}
        <div className="absolute inset-x-2 bottom-2 bg-black/85 backdrop-blur-md rounded-md py-0.5 px-1 text-[8px] font-mono font-bold text-amber-300 border border-white/10 uppercase tracking-tighter">
          QR Placeholder
        </div>
      </div>

      <span className="text-[11px] font-extrabold text-neutral-800 mt-2.5 leading-tight">
        {label || platformTitle}
      </span>
      <span className="text-[9px] text-neutral-500 font-medium mt-0.5">
        Official Store URL Pending
      </span>
    </div>
  );
};
