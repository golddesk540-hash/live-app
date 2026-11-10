'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Globe, ArrowLeft, Rocket, Sparkles, Trophy } from 'lucide-react';
import { formatBoostTime, PKWinnerBoost } from '@/lib/pk';

interface PKWinnerBoostScreenProps {
  battleId?: string;
  initialBoostData?: PKWinnerBoost | null;
  onBack?: () => void;
  initialLanguage?: 'en' | 'ur';
}

export default function PKWinnerBoostScreen({
  battleId = '00000000-0000-0000-0000-000000000604',
  initialBoostData,
  onBack,
  initialLanguage = 'en',
}: PKWinnerBoostScreenProps) {
  const [lang, setLang] = useState<'en' | 'ur'>(initialLanguage);
  const [boost, setBoost] = useState<PKWinnerBoost | null>(initialBoostData || null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(1799); // 29:59 matching reference picture
  const [loading, setLoading] = useState(!initialBoostData);

  const isRtl = lang === 'ur';

  useEffect(() => {
    if (!initialBoostData) {
      fetch(`/api/pk/boost/${battleId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.boost) {
            setBoost(data.boost);
            setRemainingSeconds(data.boost.remainingSeconds ?? 1799);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [battleId, initialBoostData]);

  // Client-side ticking countdown for smooth second updates
  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedCountdown = formatBoostTime(remainingSeconds);

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="relative w-full max-w-md mx-auto min-h-screen bg-[#0d081e] text-white flex flex-col justify-between overflow-hidden shadow-2xl font-sans select-none border-x border-[#231b3d]"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#180f33] via-[#0d081e] to-[#070412] pointer-events-none" />

      {/* TOP HEADER */}
      <div className="relative z-30 pt-6 pb-2 px-5 flex items-center justify-between">
        {onBack ? (
          <button
            onClick={onBack}
            className="p-1.5 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-5" />
        )}

        <h1 className="text-xl font-bold tracking-tight text-white drop-shadow-md">
          {isRtl ? 'ونر بوسٹ' : 'Winner Boost'}
        </h1>

        {/* Language Switcher */}
        <button
          onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
          className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 flex items-center gap-1 shadow-sm"
          title="Toggle Language"
        >
          <Globe className="w-3.5 h-3.5 text-[#ff2d78]" />
          <span>{lang === 'en' ? 'اردو' : 'EN'}</span>
        </button>
      </div>

      {/* MAIN HERO SECTION (Exact match to 06_05_winner_boost.png) */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-6 py-4">
        {/* Ambient Sunburst Rays Behind Rocket Badge */}
        <div className="relative flex items-center justify-center">
          {/* Radiant Sunburst Glow */}
          <div className="absolute w-72 h-72 rounded-full bg-gradient-to-r from-[#ec4899]/20 via-[#a855f7]/25 to-[#ec4899]/20 blur-2xl pointer-events-none" />

          {/* Radiating Light Streaks / Sunburst (SVG) */}
          <div className="absolute w-64 h-64 pointer-events-none opacity-40">
            <svg viewBox="0 0 200 200" className="w-full h-full text-[#ff2d78] animate-spin-slow">
              {[...Array(16)].map((_, i) => (
                <line
                  key={i}
                  x1="100"
                  y1="100"
                  x2={100 + 95 * Math.cos((i * Math.PI) / 8)}
                  y2={100 + 95 * Math.sin((i * Math.PI) / 8)}
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeDasharray="4 8"
                  opacity="0.6"
                />
              ))}
            </svg>
          </div>

          {/* Circular Glowing Neon Ring Frame */}
          <div className="relative z-10 w-48 h-48 rounded-full bg-gradient-to-b from-[#251545] to-[#120826] border-4 border-[#ff2d78] shadow-[0_0_35px_rgba(255,45,120,0.5)] flex items-center justify-center p-3">
            {/* Inner Dark Vignette */}
            <div className="relative w-full h-full rounded-full bg-[#110926] overflow-hidden flex items-center justify-center shadow-inner">
              {/* Rocket SVG Graphic matching 06_05_winner_boost.png */}
              <div className="relative w-28 h-28 transform -rotate-12 translate-x-1 -translate-y-1">
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]">
                  {/* Fiery Exhaust Flame */}
                  <g className="animate-pulse">
                    <path
                      d="M28 72 C 22 84, 18 92, 14 96 C 26 90, 36 86, 44 80 Z"
                      fill="#ff3b30"
                      opacity="0.9"
                    />
                    <path
                      d="M26 74 C 20 82, 17 88, 15 92 C 23 88, 32 84, 38 78 Z"
                      fill="#ff9500"
                    />
                    <path
                      d="M25 76 C 21 82, 19 86, 17 88 C 22 86, 28 82, 32 78 Z"
                      fill="#ffcc00"
                    />
                  </g>

                  {/* Rocket Fins */}
                  <path d="M22 55 C 15 62, 12 70, 14 74 C 20 74, 30 70, 35 65 Z" fill="#ff2d78" />
                  <path d="M55 22 C 62 15, 70 12, 74 14 C 74 20, 70 30, 65 35 Z" fill="#ff2d78" />
                  <path d="M38 68 L 28 78 L 44 76 Z" fill="#d91a60" />

                  {/* Rocket Main Fuselage */}
                  <path
                    d="M32 68 C 28 48, 42 28, 76 12 C 84 10, 86 12, 84 20 C 68 54, 48 68, 32 68 Z"
                    fill="#f1f5f9"
                  />
                  {/* Shading Belly */}
                  <path
                    d="M32 68 C 28 48, 38 32, 60 22 C 45 42, 38 56, 32 68 Z"
                    fill="#cbd5e1"
                  />

                  {/* Cockpit Window */}
                  <circle cx="58" cy="38" r="8" fill="#1e293b" />
                  <circle cx="58" cy="38" r="6" fill="#38bdf8" />
                  <circle cx="56" cy="36" r="2.5" fill="#ffffff" opacity="0.8" />

                  {/* Nose Cone Tip */}
                  <path
                    d="M68 16 C 74 13, 80 11, 84 12 C 85 16, 83 22, 80 28 C 76 22, 72 18, 68 16 Z"
                    fill="#ff2d78"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Title and Description */}
        <div className="mt-7 text-center">
          <h2 className="text-2xl font-black text-white tracking-tight drop-shadow-md">
            {isRtl ? 'ونر بوسٹ فعال ہے' : 'Winner Boost Active'}
          </h2>
          <p className="text-sm text-white/70 font-medium mt-1.5 max-w-xs mx-auto">
            {isRtl ? 'اگلے 30 منٹ کے لیے +20% پوائنٹس' : '+ 20% points for next 30 minutes'}
          </p>
        </div>

        {/* COUNTDOWN TIMER CARD (29:59) */}
        <div className="mt-7 w-full max-w-[280px]">
          <div className="bg-[#18112c]/95 border border-[#3b2b5f] rounded-2xl py-3.5 px-6 shadow-xl flex items-center justify-center gap-3 backdrop-blur-md">
            {/* Stopwatch / Clock Icon with Pink Outline */}
            <div className="w-8 h-8 rounded-full border-2 border-[#ff2d78] flex items-center justify-center text-[#ff2d78] shadow-[0_0_10px_rgba(255,45,120,0.4)]">
              <Clock className="w-4 h-4 stroke-[2.5]" />
            </div>

            {/* Countdown Digits */}
            <span className="text-3xl font-black tracking-widest text-white drop-shadow-md">
              {formattedCountdown}
            </span>
          </div>
        </div>
      </div>

      {/* BOTTOM WATERMARK BADGE (Exact match: "6.5 Winner Boost") */}
      <div className="relative z-30 px-6 pb-6 pt-2 flex justify-center bg-[#0d081e]">
        <div className="w-full py-3 rounded-2xl bg-[#8c1b64] text-white text-center font-extrabold text-sm tracking-wide shadow-lg border border-[#a82a7a]/50">
          <span>{isRtl ? '6.5 ونر بوسٹ' : '6.5 Winner Boost'}</span>
        </div>
      </div>
    </div>
  );
}
