'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldAlert, Compass } from 'lucide-react';
import { useLanguage } from '@/lib/languageContext';
import { NEAR_FEATURE_ENABLED } from '@/lib/featureFlags';

interface NearScreenProps {
  onBack?: () => void;
  className?: string;
}

export default function NearScreen({ onBack, className = '' }: NearScreenProps) {
  const router = useRouter();
  const { isUr } = useLanguage();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push('/live/explore');
    }
  };

  return (
    <div
      data-testid="near-screen-container"
      className={`min-h-[75vh] w-full flex flex-col justify-start items-center px-4 sm:px-6 py-2 sm:py-4 ${className}`}
    >
      {/* 1. TOP HEADER (Strictly matching 03_09_near_default_off.png) */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between py-2 mb-4 sm:mb-6">
        {/* Left: Near / Back navigation */}
        <button
          type="button"
          onClick={handleBack}
          aria-label="Back to Explore"
          className="text-base sm:text-lg font-bold text-white/90 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-white/60 sm:hidden" />
          <span>Near</span>
        </button>

        {/* Center: Glowing Purple Pill Header with bold white "Near" */}
        <div className="relative">
          <div className="absolute inset-0 bg-purple-600/40 rounded-full blur-md transform scale-110" />
          <div className="relative px-5 py-1 rounded-full bg-gradient-to-r from-purple-900/80 via-purple-700/80 to-purple-900/80 border border-purple-500/30 shadow-lg shadow-purple-950/50">
            <span className="text-base sm:text-lg font-extrabold text-white tracking-wide">
              Near
            </span>
          </div>
        </div>

        {/* Right placeholder to keep header symmetrical */}
        <div className="w-12" />
      </div>

      {/* 2. LARGE ROUNDED DARK CONTENT PANEL (1:1 with 03_09_near_default_off.png) */}
      <div
        data-testid="near-card-panel"
        className="w-full max-w-sm sm:max-w-md rounded-[32px] sm:rounded-[36px] bg-[#121324] border border-white/[0.06] p-8 sm:p-10 flex flex-col items-center text-center shadow-2xl shadow-black/80 backdrop-blur-xl relative overflow-hidden my-auto"
      >
        {/* Ambient Top Glow inside card */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-purple-600/10 via-indigo-600/5 to-transparent pointer-events-none" />

        {/* Centered 3D Location Map Pin Illustration */}
        <div className="relative mb-6 sm:mb-8 group">
          <div className="w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center relative">
            {/* Soft Radial Glow */}
            <div className="absolute inset-0 bg-purple-500/10 rounded-full blur-xl" />
            
            {/* Primary Cropped Asset from 03_09 Reference Image */}
            <img
              src="/assets/near/near_location_pin@2x.png"
              alt="Near Location Pin (Default Off)"
              className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
              loading="eager"
            />
          </div>
        </div>

        {/* Main Heading: Near (Location) */}
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
          {isUr ? 'قریبی براڈکاسٹرز (لوکیشن)' : 'Near (Location)'}
        </h2>

        {/* Status Message: This feature is currently turned OFF. */}
        <p className="text-sm sm:text-base text-zinc-400 font-normal leading-relaxed max-w-xs">
          {isUr ? 'یہ فیچر فی الحال بند ہے۔' : 'This feature is currently turned OFF.'}
        </p>

        {/* Feature Flag Verification Indicator (Guarantees zero GPS / Zero tracking) */}
        <div className="mt-8 pt-6 border-t border-white/[0.05] w-full flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
          <span>Status: Disabled by default • No GPS active</span>
        </div>
      </div>

      {/* 3. OPTIONAL EXPLORE ACTION (Helps users seamlessly browse live streams instead) */}
      <div className="mt-6 sm:mt-8">
        <button
          type="button"
          onClick={handleBack}
          className="px-5 py-2 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 text-xs font-semibold text-white/70 hover:text-white border border-white/10 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Compass className="w-3.5 h-3.5 text-pink-400" />
          <span>{isUr ? 'لائیو براڈکاسٹ دریافت کریں' : 'Return to Explore'}</span>
        </button>
      </div>
    </div>
  );
}
