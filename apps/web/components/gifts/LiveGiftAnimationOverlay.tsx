'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

export interface LiveGiftBroadcastEvent {
  id: string;
  giftTransactionId?: string;
  senderNickname: string;
  recipientNickname: string;
  pkHostSide?: string | null;
  giftId: string;
  giftName: string;
  giftNameUr?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  animationUrl?: string | null;
  assetType?: string;
  giftType?: string;
  quantity: number;
  totalCoinAmount: number;
}

interface LiveGiftAnimationOverlayProps {
  activeGift: LiveGiftBroadcastEvent | null;
  queueCount?: number;
  lowEndMode?: boolean;
  isUrdu?: boolean;
  placement?: 'stage-top' | 'room-floating';
}

const FALLBACK_IMG = '/assets/gifts/fallback_gift.png';

export default function LiveGiftAnimationOverlay({
  activeGift,
  queueCount = 0,
  lowEndMode = false,
  isUrdu = false,
  placement = 'stage-top',
}: LiveGiftAnimationOverlayProps) {
  if (!activeGift) return null;

  const isLuxury =
    activeGift.giftType === 'luxury' ||
    activeGift.giftType === 'vip' ||
    activeGift.totalCoinAmount >= 3000;

  const displayGiftName = isUrdu && activeGift.giftNameUr ? activeGift.giftNameUr : activeGift.giftName;
  const imgSrc = activeGift.imageUrl || activeGift.thumbnailUrl || FALLBACK_IMG;

  return (
    <div
      data-testid="live-gift-animation-overlay"
      className={`pointer-events-none select-none z-30 ${
        placement === 'room-floating'
          ? 'absolute top-20 left-3 right-3 max-w-[330px]'
          : 'w-full px-1'
      }`}
    >
      <div
        className={`relative flex items-center gap-2.5 rounded-2xl border px-3 py-2 shadow-xl transition-all duration-300 ${
          lowEndMode
            ? 'bg-[#1c0c34]/95 border-[#ff3d8d]/45'
            : isLuxury
            ? 'bg-gradient-to-r from-[#2c0946]/95 via-[#6b1152]/90 to-[#220a3a]/95 border-amber-400/60 backdrop-blur-md shadow-[0_0_24px_rgba(255,61,141,0.45)] animate-pulse'
            : 'bg-gradient-to-r from-[#290b45]/95 via-[#521258]/90 to-[#1a0a30]/95 border-[#ff3d8d]/60 backdrop-blur-md shadow-[0_0_18px_rgba(255,47,125,0.38)]'
        }`}
      >
        {/* Gift Avatar Thumbnail */}
        <div
          className={`relative w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center bg-[#120624]/80 border ${
            isLuxury ? 'border-amber-300/60' : 'border-pink-400/40'
          }`}
        >
          <img
            src={imgSrc}
            alt={displayGiftName}
            onError={(e) => {
              e.currentTarget.src = FALLBACK_IMG;
            }}
            className="w-9 h-9 object-contain"
          />
          {!lowEndMode && (
            <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1 -right-1 drop-shadow" />
          )}
        </div>

        {/* Sender -> Gift -> Host Info */}
        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-pink-200 truncate">
            <span className="text-white truncate max-w-[110px]">{activeGift.senderNickname}</span>
            <span className="text-pink-300/80 font-medium">{isUrdu ? 'نے بھیجا' : 'sent'}</span>
            <span className="text-amber-300 truncate">{displayGiftName}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-purple-200/85 truncate">
            <span>{isUrdu ? 'وصول کنندہ:' : 'To:'}</span>
            <span className="font-semibold text-white">{activeGift.recipientNickname}</span>
            {activeGift.pkHostSide && (
              <span className="px-1.5 py-0.5 rounded bg-pink-500/25 border border-pink-400/35 text-[9px] font-bold text-pink-200 uppercase">
                {activeGift.pkHostSide === 'host_a' ? 'Host A' : 'Host B'}
              </span>
            )}
          </div>
        </div>

        {/* Combo Quantity Badge */}
        <div className="flex flex-col items-end flex-shrink-0">
          <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#ff2e83] to-[#ff6cab] text-white text-xs font-extrabold tracking-wide shadow">
            x{activeGift.quantity}
          </span>
          {queueCount > 0 && (
            <span className="mt-0.5 text-[9px] text-purple-200/70">
              +{queueCount} {isUrdu ? 'قطار میں' : 'queued'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
