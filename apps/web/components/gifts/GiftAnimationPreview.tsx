'use client';

import React, { useEffect, useState } from 'react';
import { Pause, Play, Sparkles } from 'lucide-react';

export type GiftAssetType = 'png' | 'webp' | 'gif' | 'lottie' | 'video';

export const DEFAULT_FALLBACK_GIFT_IMAGE = '/assets/gifts/fallback_gift.png';

interface LottieMeta {
  name?: string;
  frameRate?: number;
  durationSec?: number;
  layerCount?: number;
}

interface GiftAnimationPreviewProps {
  name: string;
  imageUrl?: string | null;
  animationUrl?: string | null;
  fallbackImageUrl?: string | null;
  assetType?: GiftAssetType | string;
  playing?: boolean;
  showControls?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function GiftAnimationPreview({
  name,
  imageUrl,
  animationUrl,
  fallbackImageUrl,
  assetType = 'png',
  playing: initialPlaying = true,
  showControls = false,
  size = 'lg',
  className = '',
}: GiftAnimationPreviewProps) {
  const safeFallback = fallbackImageUrl || DEFAULT_FALLBACK_GIFT_IMAGE;
  const primaryImage = imageUrl || animationUrl || safeFallback;
  const [imgSrc, setImgSrc] = useState<string>(primaryImage);
  const [videoFailed, setVideoFailed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(initialPlaying);
  const [lottieMeta, setLottieMeta] = useState<LottieMeta | null>(null);

  useEffect(() => {
    setImgSrc(
      assetType === 'gif' || assetType === 'webp'
        ? animationUrl || imageUrl || safeFallback
        : imageUrl || animationUrl || safeFallback
    );
    setVideoFailed(false);
  }, [imageUrl, animationUrl, assetType, safeFallback]);

  useEffect(() => {
    setIsPlaying(initialPlaying);
  }, [initialPlaying]);

  useEffect(() => {
    if (assetType !== 'lottie' || !animationUrl) {
      setLottieMeta(null);
      return;
    }
    let cancelled = false;
    fetch(animationUrl)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data || typeof data !== 'object') return;
        const fr = Number(data.fr || 30);
        const ip = Number(data.ip || 0);
        const op = Number(data.op || 60);
        const layers = Array.isArray(data.layers) ? data.layers.length : 1;
        setLottieMeta({
          name: typeof data.nm === 'string' ? data.nm : undefined,
          frameRate: fr,
          durationSec: fr > 0 ? Number(((op - ip) / fr).toFixed(1)) : 2,
          layerCount: layers,
        });
      })
      .catch(() => {
        if (!cancelled) setLottieMeta(null);
      });
    return () => {
      cancelled = true;
    };
  }, [assetType, animationUrl]);

  const sizeClass =
    size === 'sm'
      ? 'w-14 h-14'
      : size === 'md'
        ? 'w-24 h-24'
        : 'w-40 h-40 sm:w-44 sm:h-44';

  const normalizedType = (assetType || 'png').toLowerCase() as GiftAssetType;

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <div
        className={`relative flex items-center justify-center rounded-2xl overflow-hidden ${sizeClass}`}
      >
        {/* Ambient radial neon aura */}
        <div
          className={`absolute inset-1 rounded-full bg-gradient-to-tr from-fuchsia-600/25 via-pink-500/20 to-amber-400/25 blur-xl transition-transform duration-700 ${
            isPlaying ? 'scale-110 animate-pulse' : 'scale-95 opacity-60'
          }`}
        />

        {/* Animated sparkle rings for Lottie / Animated / WebP */}
        {isPlaying && (normalizedType === 'lottie' || normalizedType === 'gif' || normalizedType === 'webp') && (
          <>
            <span className="pointer-events-none absolute top-2 left-3 w-2 h-2 rounded-full bg-amber-300 shadow-[0_0_10px_#fbbf24] animate-ping" />
            <span
              className="pointer-events-none absolute bottom-3 right-3 w-1.5 h-1.5 rounded-full bg-pink-400 shadow-[0_0_10px_#f472b6] animate-ping"
              style={{ animationDelay: '350ms' }}
            />
            <span className="pointer-events-none absolute inset-2 rounded-2xl border border-pink-400/30 animate-pulse" />
          </>
        )}

        {normalizedType === 'video' && animationUrl && !videoFailed ? (
          <video
            src={animationUrl}
            poster={imageUrl || safeFallback}
            autoPlay={isPlaying}
            loop
            muted
            playsInline
            onError={() => setVideoFailed(true)}
            className="relative z-10 w-full h-full object-contain drop-shadow-[0_10px_18px_rgba(236,72,153,0.45)]"
          />
        ) : (
          <img
            src={imgSrc}
            alt={name}
            onError={() => {
              if (imgSrc !== safeFallback) {
                setImgSrc(safeFallback);
              }
            }}
            className={`relative z-10 w-[86%] h-[86%] object-contain drop-shadow-[0_10px_22px_rgba(236,72,153,0.42)] transition-transform duration-700 ${
              isPlaying ? 'animate-giftFloat scale-105' : 'scale-100'
            }`}
          />
        )}
      </div>

      {showControls && (
        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2 text-[11px]">
          <button
            type="button"
            onClick={() => setIsPlaying((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded-full bg-[#241046] border border-pink-500/40 px-2.5 py-1 text-pink-200 hover:bg-[#31155e] transition-colors"
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <span className="inline-flex items-center gap-1 rounded-full bg-[#1a0a36] border border-purple-500/30 px-2.5 py-1 text-purple-200 uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-amber-400" />
            {normalizedType}
            {lottieMeta?.durationSec ? ` • ${lottieMeta.durationSec}s` : ''}
          </span>
        </div>
      )}

      <style jsx>{`
        @keyframes giftFloat {
          0%,
          100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-6px) scale(1.06);
          }
        }
        .animate-giftFloat {
          animation: giftFloat 2.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
