'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Crown, Sparkles } from 'lucide-react';

export interface BannerItem {
  id: string;
  title: string;
  description: string;
  desktopImageUrl: string;
  mobileImageUrl: string;
  destination: string;
  ctaText: string;
  badgeText?: string;
  displayOrder: number;
}

interface DiscoveryBannerCarouselProps {
  className?: string;
}

export default function DiscoveryBannerCarousel({ className = '' }: DiscoveryBannerCarouselProps) {
  const router = useRouter();
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Fetch banners from backend API
  useEffect(() => {
    let isMounted = true;
    async function loadBanners() {
      try {
        const res = await fetch('/api/discovery/banners');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && Array.isArray(data.banners) && data.banners.length > 0) {
            setBanners(data.banners);
          }
        }
      } catch (err) {
        console.error('Failed to load discovery banners:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadBanners();
    return () => { isMounted = false; };
  }, []);

  // Automatic sliding timer (4 seconds)
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [banners.length, isPaused]);

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 50) {
      handleNext();
    } else if (distance < -50) {
      handlePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleBannerClick = async (banner: BannerItem) => {
    // Record click analytics asynchronously
    try {
      fetch(`/api/discovery/banners/${banner.id}/click`, { method: 'POST' });
    } catch (e) {
      // ignore tracking error
    }
    const dest = banner.destination || '/ranking';
    router.push(dest);
  };

  if (loading) {
    return (
      <div className={`w-full aspect-[21/9] sm:aspect-[24/8] md:aspect-[28/8] max-h-56 rounded-2xl sm:rounded-3xl bg-white/5 border border-white/5 animate-pulse ${className}`} />
    );
  }

  if (banners.length === 0) return null;

  const current = banners[currentIndex] || banners[0];

  return (
    <div
      className={`relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl group select-none ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      data-testid="discovery-banner-carousel"
    >
      {/* Banner Canvas Card */}
      <div
        onClick={() => handleBannerClick(current)}
        className="cursor-pointer relative w-full aspect-[21/9] sm:aspect-[24/8] md:aspect-[28/8] max-h-56 rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-r from-[#290d54] via-[#43167f] to-[#6d1bb5] border border-white/10 flex items-center justify-between p-4 sm:p-6 md:p-8"
      >
        {/* Subtle decorative galaxy glows */}
        <div className="absolute top-0 right-1/4 w-48 h-48 rounded-full bg-pink-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-40 h-40 rounded-full bg-purple-600/30 blur-2xl pointer-events-none" />

        {/* LEFT TEXT & CTA CONTENT */}
        <div className="relative z-10 flex flex-col justify-center items-start space-y-1.5 sm:space-y-2.5 max-w-[65%]">
          {current.badgeText && (
            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[#FF2E74] to-[#ff6b8b] text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white shadow-sm shadow-pink-500/30">
              {current.badgeText}
            </span>
          )}

          <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight drop-shadow-md">
            {current.title}
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-purple-200/90 font-medium truncate max-w-full">
            {current.description}
          </p>

          <button
            type="button"
            className="mt-1 sm:mt-2 px-3.5 py-1 sm:px-5 sm:py-2 rounded-full bg-gradient-to-r from-[#ff5e62] to-[#ff9966] hover:brightness-110 active:scale-95 text-white text-[11px] sm:text-xs md:text-sm font-bold shadow-lg shadow-orange-500/30 flex items-center gap-1 transition-all"
          >
            <span>{current.ctaText || 'View Now >'}</span>
          </button>
        </div>

        {/* RIGHT REGAL ILLUSTRATION (Golden Crown matching 03_05 reference) */}
        <div className="relative z-10 flex items-center justify-center pr-2 sm:pr-6 shrink-0">
          <div className="relative flex items-center justify-center">
            {/* Crown Glow Aura */}
            <div className="absolute w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-amber-400/25 blur-xl animate-pulse" />
            
            {/* Gold Crown graphic */}
            <div className="relative w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 flex items-center justify-center drop-shadow-[0_10px_20px_rgba(245,158,11,0.4)]">
              <span className="text-5xl sm:text-7xl md:text-8xl select-none transform hover:scale-110 transition-transform">
                👑
              </span>
            </div>
          </div>
        </div>

        {/* Subtle Carousel Slide Transition Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/10 pointer-events-none" />
      </div>

      {/* PREVIOUS & NEXT CONTROLS (Desktop & Tablet Hover) */}
      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous banner"
            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white/80 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-white/10"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Next banner"
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white/80 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-white/10"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* PAGINATION DOT INDICATORS */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 pointer-events-none">
            {banners.map((_, i) => (
              <span
                key={i}
                className={`transition-all duration-300 rounded-full ${
                  i === currentIndex
                    ? 'w-5 sm:w-6 h-1.5 bg-gradient-to-r from-[#ff5e62] to-[#ff9966]'
                    : 'w-1.5 h-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
