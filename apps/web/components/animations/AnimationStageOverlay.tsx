'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Crown, Flame, Sparkles, Volume2, VolumeX } from 'lucide-react';
import type { AnimationQueueItem, UserAnimationPreferences } from '@/lib/animations';

const FALLBACK_IMG = '/assets/gifts/fallback_gift.png';

interface AnimationStageOverlayProps {
  activeAnimations: AnimationQueueItem[];
  activeEntrances: AnimationQueueItem[];
  queuedAnimations?: AnimationQueueItem[];
  preferences?: UserAnimationPreferences | null;
  isUrdu?: boolean;
  stageMode?: 'live' | 'pk';
  onAnimationComplete?: (queueId: string) => void;
  fallbackShowcaseGift?: {
    senderNickname: string;
    senderAvatarUrl?: string;
    giftName: string;
    giftNameUr?: string;
    recipientNickname: string;
    quantity: number;
    imageUrl: string;
  } | null;
}

export default function AnimationStageOverlay({
  activeAnimations,
  activeEntrances,
  queuedAnimations = [],
  preferences,
  isUrdu = false,
  stageMode = 'pk',
  onAnimationComplete,
  fallbackShowcaseGift = null,
}: AnimationStageOverlayProps) {
  const [deviceReducedMotion, setDeviceReducedMotion] = useState(false);
  const completedTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const audioCacheRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const playedSoundsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setDeviceReducedMotion(Boolean(mql.matches));
    sync();
    mql.addEventListener?.('change', sync);
    return () => mql.removeEventListener?.('change', sync);
  }, []);

  const effectiveReduceAnimations = Boolean(
    preferences?.reduceAnimations ||
      (preferences?.respectDeviceReducedMotion !== false && deviceReducedMotion)
  );
  const allowLargeAnimations =
    preferences?.enableLargeAnimations !== false && !effectiveReduceAnimations;
  const allowSounds = preferences?.enableSoundEffects !== false;

  // Schedule auto-completion callbacks cleanly & clean up timers to prevent leaks
  useEffect(() => {
    const visibleItems = [...activeAnimations, ...activeEntrances];
    const activeIds = new Set(visibleItems.map((i) => i.queueId));

    // Clear timers for items no longer active
    for (const [id, t] of Array.from(completedTimersRef.current.entries())) {
      if (!activeIds.has(id)) {
        clearTimeout(t);
        completedTimersRef.current.delete(id);
      }
    }

    for (const item of visibleItems) {
      // Play approved SFX once per queueId if allowed
      if (allowSounds && item.soundUrl && !playedSoundsRef.current.has(item.queueId)) {
        playedSoundsRef.current.add(item.queueId);
        try {
          if (typeof Audio !== 'undefined') {
            let audio = audioCacheRef.current.get(item.soundUrl);
            if (!audio) {
              audio = new Audio(item.soundUrl);
              audio.preload = 'auto';
              if (audioCacheRef.current.size > 16) {
                audioCacheRef.current.clear();
              }
              audioCacheRef.current.set(item.soundUrl, audio);
            }
            audio.currentTime = 0;
            audio.volume = 0.55;
            audio.play().catch(() => {});
          }
        } catch {}
      }

      if (onAnimationComplete && !completedTimersRef.current.has(item.queueId)) {
        const waitMs = Math.max(900, Math.min(12000, item.durationMs || 3200));
        const timer = setTimeout(() => {
          completedTimersRef.current.delete(item.queueId);
          onAnimationComplete(item.queueId);
        }, waitMs);
        completedTimersRef.current.set(item.queueId, timer);
      }
    }
  }, [activeAnimations, activeEntrances, allowSounds, onAnimationComplete]);

  useEffect(() => {
    const timers = completedTimersRef.current;
    return () => {
      for (const t of Array.from(timers.values())) {
        clearTimeout(t);
      }
      timers.clear();
    };
  }, []);

  const primaryGift = useMemo(() => {
    return (
      activeAnimations.find((a) => a.eventCategory === 'gift' && a.isFullscreen) ||
      activeAnimations.find((a) => a.eventCategory === 'gift') ||
      null
    );
  }, [activeAnimations]);

  const floatingSideGifts = useMemo(() => {
    return activeAnimations.filter(
      (a) => a.eventCategory === 'gift' && (!primaryGift || a.queueId !== primaryGift.queueId)
    );
  }, [activeAnimations, primaryGift]);

  const activeEntrance = activeEntrances[0] || null;

  const isHeavyGiftVisible = Boolean(
    primaryGift && (primaryGift.isFullscreen || primaryGift.animationTier === 'luxury' || primaryGift.animationTier === 'special_event')
  );

  // Use lightweight showcase overlay if idle & showcase prop supplied (matches 07_04 ref when opened fresh)
  const renderGiftBanner = primaryGift
    ? {
        queueId: primaryGift.queueId,
        senderNickname: primaryGift.senderNickname || 'Supporter',
        senderAvatarUrl: primaryGift.senderAvatarUrl || '/assets/following/host1@2x.png',
        giftName:
          isUrdu && primaryGift.giftNameUr
            ? primaryGift.giftNameUr
            : primaryGift.giftName || 'Castle',
        recipientNickname: primaryGift.recipientNickname,
        quantity: primaryGift.quantity,
        pkHostSide: primaryGift.pkHostSide,
        imageUrl: primaryGift.imageUrl || primaryGift.thumbnailUrl || primaryGift.fallbackUrl || FALLBACK_IMG,
        animationUrl: primaryGift.animationUrl,
        assetType: primaryGift.assetType,
        tier: primaryGift.animationTier,
        isFullscreen: primaryGift.isFullscreen,
      }
    : fallbackShowcaseGift
    ? {
        queueId: 'showcase_castle',
        senderNickname: fallbackShowcaseGift.senderNickname,
        senderAvatarUrl: fallbackShowcaseGift.senderAvatarUrl || '/assets/following/host1@2x.png',
        giftName:
          isUrdu && fallbackShowcaseGift.giftNameUr
            ? fallbackShowcaseGift.giftNameUr
            : fallbackShowcaseGift.giftName,
        recipientNickname: fallbackShowcaseGift.recipientNickname,
        quantity: fallbackShowcaseGift.quantity,
        pkHostSide: 'host_a' as const,
        imageUrl: fallbackShowcaseGift.imageUrl,
        animationUrl: '/assets/gifts/animations/castle.json',
        assetType: 'lottie',
        tier: 'luxury',
        isFullscreen: true,
      }
    : null;

  return (
    <div
      data-testid="animation-stage-overlay"
      data-reduced-mode={effectiveReduceAnimations ? 'true' : 'false'}
      data-large-enabled={allowLargeAnimations ? 'true' : 'false'}
      data-sound-enabled={allowSounds ? 'true' : 'false'}
      className="pointer-events-none select-none absolute inset-0 z-20 overflow-hidden flex flex-col justify-between"
    >
      {/* 1. Host Entrance Effect Banner (Non-blocking top-stage slide) */}
      <div className="pt-10 px-3 flex flex-col items-center gap-1.5">
        {activeEntrance && (
          <div
            data-testid="host-entrance-banner"
            data-entrance-type={activeEntrance.entranceType || 'standard'}
            className={`w-full max-w-[355px] rounded-2xl border px-3 py-2 flex items-center gap-2.5 shadow-2xl ${
              effectiveReduceAnimations ? '' : 'animate-[fadeIn_0.3s_ease-out]'
            } ${
              activeEntrance.entranceType === 'vip'
                ? 'bg-gradient-to-r from-[#3b1d07]/95 via-[#7c2d12]/90 to-[#2e1065]/95 border-amber-400/80 shadow-[0_0_24px_rgba(251,191,36,0.45)]'
                : activeEntrance.entranceType === 'special_event'
                ? 'bg-gradient-to-r from-[#0c4a6e]/95 via-[#701a75]/90 to-[#1e1b4b]/95 border-cyan-300/75 shadow-[0_0_24px_rgba(56,189,248,0.4)]'
                : activeEntrance.entranceType === 'premium'
                ? 'bg-gradient-to-r from-[#4a044e]/95 via-[#831843]/90 to-[#2e1065]/95 border-pink-400/75 shadow-[0_0_20px_rgba(244,114,182,0.4)]'
                : 'bg-gradient-to-r from-[#1e1b4b]/95 via-[#4c1d95]/90 to-[#1e1b4b]/95 border-purple-400/60'
            }`}
          >
            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-amber-300 flex-shrink-0 bg-[#120624]">
              <img
                src={activeEntrance.recipientAvatarUrl || '/assets/studio/host_zara_avatar.png'}
                alt={activeEntrance.recipientNickname}
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_IMG;
                }}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1 leading-tight">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-extrabold text-white truncate">
                  {activeEntrance.recipientNickname}
                </span>
                {activeEntrance.vipBadgeLabel && (
                  <span
                    data-testid="host-entrance-vip-badge"
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-[#230938] text-[9px] font-black uppercase shadow"
                  >
                    <Crown className="w-2.5 h-2.5" />
                    {activeEntrance.vipBadgeLabel}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-purple-200/90 mt-0.5 truncate">
                {isUrdu
                  ? `آئی ڈی: ${activeEntrance.recipientPoppoId || '8802194'} • ${activeEntrance.giftNameUr || activeEntrance.giftName}`
                  : `ID: ${activeEntrance.recipientPoppoId || '8802194'} • ${activeEntrance.giftName || 'Host Entrance'}`}
              </p>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {!effectiveReduceAnimations && (
                <img
                  src={activeEntrance.imageUrl || FALLBACK_IMG}
                  alt="Entrance"
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_IMG;
                  }}
                  className="w-8 h-8 object-contain"
                />
              )}
              {allowSounds ? (
                <Volume2 className="w-3.5 h-3.5 text-amber-300" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-purple-300/60" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Center / PK-Side Gift Visual & Floating Banner */}
      <div className="relative flex-1 flex flex-col items-center justify-end pb-4 px-3">
        {/* Fireworks & Radiant Luxury Stage Animation when Large Animations enabled */}
        {renderGiftBanner && isHeavyGiftVisible && allowLargeAnimations && (
          <div
            data-testid="large-fullscreen-gift-fx"
            className={`relative flex items-center justify-center mb-1 ${
              stageMode === 'pk' && renderGiftBanner.pkHostSide === 'host_a'
                ? '-translate-x-5'
                : stageMode === 'pk' && renderGiftBanner.pkHostSide === 'host_b'
                ? 'translate-x-5'
                : ''
            }`}
          >
            {/* Fireworks & Aurora Radial Glow */}
            <div className="absolute -inset-8 rounded-full bg-radial from-pink-500/35 via-purple-600/20 to-transparent blur-xl animate-pulse" />
            <div className="absolute -left-16 -top-8 w-16 h-16 rounded-full border border-amber-300/40 animate-ping opacity-60" />
            <div className="absolute -right-16 -top-6 w-14 h-14 rounded-full border border-pink-400/50 animate-ping opacity-60" />

            {renderGiftBanner.assetType === 'video' && renderGiftBanner.animationUrl ? (
              <video
                src={renderGiftBanner.animationUrl}
                autoPlay
                muted={!allowSounds}
                loop
                playsInline
                className="relative z-10 w-44 h-44 object-contain drop-shadow-[0_0_28px_rgba(255,61,168,0.65)]"
              />
            ) : (
              <img
                src={renderGiftBanner.imageUrl || FALLBACK_IMG}
                alt={renderGiftBanner.giftName}
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_IMG;
                }}
                className="relative z-10 w-44 h-44 object-contain drop-shadow-[0_0_32px_rgba(255,82,191,0.75)] animate-bounce"
              />
            )}
          </div>
        )}

        {/* Small / Medium Side Animation (or Lightweight Downgraded Mode when Large disabled) */}
        {renderGiftBanner && (!isHeavyGiftVisible || !allowLargeAnimations) && (
          <div
            data-testid="compact-gift-fx"
            className={`mb-2 flex items-center justify-center ${
              stageMode === 'pk' && renderGiftBanner.pkHostSide === 'host_a'
                ? 'self-start ml-3'
                : stageMode === 'pk' && renderGiftBanner.pkHostSide === 'host_b'
                ? 'self-end mr-3'
                : 'self-center'
            }`}
          >
            <div className="relative rounded-full p-2 bg-[#23093c]/75 border border-pink-400/50 shadow-[0_0_18px_rgba(255,0,127,0.45)]">
              <img
                src={renderGiftBanner.imageUrl || FALLBACK_IMG}
                alt={renderGiftBanner.giftName}
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_IMG;
                }}
                className={`w-16 h-16 object-contain ${
                  effectiveReduceAnimations ? '' : 'animate-pulse'
                }`}
              />
            </div>
          </div>
        )}

        {/* Additional Concurrent Small Side Gift Pills */}
        {floatingSideGifts.length > 0 && (
          <div className="w-full flex flex-wrap justify-between gap-1.5 mb-1.5 px-1">
            {floatingSideGifts.slice(0, 2).map((item) => (
              <div
                key={item.queueId}
                data-testid="floating-side-gift-pill"
                data-pk-side={item.pkHostSide || 'room'}
                className={`flex items-center gap-1.5 rounded-full bg-[#190830]/90 border border-pink-400/50 px-2.5 py-1 text-[10px] shadow-lg ${
                  item.pkHostSide === 'host_b' ? 'ml-auto' : 'mr-auto'
                }`}
              >
                <img
                  src={item.thumbnailUrl || item.imageUrl || FALLBACK_IMG}
                  alt={item.giftName || 'Gift'}
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_IMG;
                  }}
                  className="w-5 h-5 object-contain"
                />
                <span className="font-bold text-white">{item.senderNickname}</span>
                <span className="text-pink-300">
                  {isUrdu && item.giftNameUr ? item.giftNameUr : item.giftName}
                </span>
                <span className="font-extrabold text-amber-300">x{item.quantity}</span>
              </div>
            ))}
          </div>
        )}

        {/* Signature Module 7.4 Floating Sender Pill (matching "Sunny sent Castle x1" in ref) */}
        {renderGiftBanner && (
          <div
            data-testid="gift-sender-pill"
            data-pk-side={renderGiftBanner.pkHostSide || 'room'}
            className="w-full max-w-[335px] rounded-full bg-[#19092e]/92 border border-amber-400/75 px-3 py-1.5 flex items-center gap-2.5 shadow-[0_0_24px_rgba(255,153,0,0.35)]"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-300 flex-shrink-0 bg-[#110622]">
              <img
                src={renderGiftBanner.senderAvatarUrl || '/assets/chat/avatar_bilal.png'}
                alt={renderGiftBanner.senderNickname}
                onError={(e) => {
                  e.currentTarget.src = '/assets/chat/avatar_bilal.png';
                }}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1 leading-tight">
              <div className="text-xs font-bold text-white truncate">
                <span>{renderGiftBanner.senderNickname}</span>{' '}
                <span className="text-purple-200 font-medium">
                  {isUrdu ? 'نے بھیجا' : 'sent'}
                </span>{' '}
                <span className="text-white font-extrabold">{renderGiftBanner.giftName}</span>{' '}
                <span className="text-amber-300 font-black">x{renderGiftBanner.quantity}</span>
              </div>
              <div className="text-[10px] text-purple-300/85 flex items-center gap-1.5 truncate">
                <span>
                  {isUrdu ? 'وصول کنندہ:' : 'To:'}{' '}
                  <strong className="text-pink-200">{renderGiftBanner.recipientNickname}</strong>
                </span>
                {stageMode === 'pk' && renderGiftBanner.pkHostSide && (
                  <span className="px-1.5 py-0.2 rounded bg-pink-500/25 border border-pink-400/40 text-[9px] font-bold text-pink-200 uppercase">
                    {renderGiftBanner.pkHostSide === 'host_a' ? 'Host A' : 'Host B'}
                  </span>
                )}
              </div>
            </div>

            {queuedAnimations.length > 0 && (
              <span
                data-testid="animation-queue-counter"
                className="px-2 py-0.5 rounded-full bg-[#ff007f] text-white text-[10px] font-bold flex items-center gap-0.5 flex-shrink-0"
              >
                <Flame className="w-2.5 h-2.5" />+{queuedAnimations.length}
              </span>
            )}
            {effectiveReduceAnimations && (
              <Sparkles className="w-3.5 h-3.5 text-purple-300/70 flex-shrink-0" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
