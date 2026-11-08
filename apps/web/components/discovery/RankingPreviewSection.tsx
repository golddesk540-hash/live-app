'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Crown, ChevronRight, Sparkles, ShieldCheck } from 'lucide-react';

export interface RankedUser {
  rank: number;
  id: string;
  poppoId: string;
  nickname: string;
  avatarUrl: string;
  country: string;
  countryCode: string;
  flagEmoji: string;
  hostLevel: number;
  wealthLevel: number;
  isVerified: boolean;
  score: number;
  scoreFormatted: string;
  profileUrl: string;
}

interface RankingPreviewSectionProps {
  className?: string;
}

export default function RankingPreviewSection({ className = '' }: RankingPreviewSectionProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<'host' | 'wealth' | 'popularity' | 'gifts' | 'country'>('host');
  const [podium, setPodium] = useState<{
    first: RankedUser | null;
    second: RankedUser | null;
    third: RankedUser | null;
  }>({ first: null, second: null, third: null });
  const [loading, setLoading] = useState(true);
  const [isComingSoon, setIsComingSoon] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadRankingPreview() {
      setLoading(true);
      try {
        const res = await fetch(`/api/discovery/rankings/preview?category=${selectedCategory}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data.isComingSoon) {
              setIsComingSoon(true);
              setPodium({ first: null, second: null, third: null });
            } else {
              setIsComingSoon(false);
              setPodium(data.podium || { first: null, second: null, third: null });
            }
          }
        }
      } catch (err) {
        console.error('Failed to load ranking preview:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadRankingPreview();
    return () => { isMounted = false; };
  }, [selectedCategory]);

  const categories = [
    { id: 'host', label: 'Host' },
    { id: 'wealth', label: 'Wealth' },
    { id: 'popularity', label: 'Popularity' },
    { id: 'country', label: 'Country' },
    { id: 'gifts', label: 'Gifts' },
  ];

  return (
    <div
      className={`w-full rounded-2xl sm:rounded-3xl bg-[#111226]/90 backdrop-blur-xl border border-white/10 p-4 sm:p-5 shadow-xl select-none ${className}`}
      data-testid="ranking-preview-section"
    >
      {/* HEADER: Title & View All Link */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
            Ranking
          </h3>
          <span className="text-[10px] uppercase font-bold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
            Monthly
          </span>
        </div>

        <Link
          href={`/ranking/${selectedCategory}`}
          className="text-xs text-white/60 hover:text-white flex items-center gap-0.5 transition-colors font-medium"
        >
          <span>View All</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* CATEGORY SWITCHER CHIPS */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelectedCategory(c.id as any)}
            className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full transition-all shrink-0 ${
              selectedCategory === c.id
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm shadow-pink-500/30'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* PODIUM DISPLAY (Matching 03_05 reference 1:1) */}
      {isComingSoon ? (
        <div className="py-8 text-center space-y-2">
          <Sparkles className="w-6 h-6 text-pink-400/60 mx-auto animate-pulse" />
          <p className="text-xs font-bold text-white">Gift Ranking Coming Soon</p>
          <p className="text-[10px] text-white/50 max-w-xs mx-auto">
            Gift leaderboard analytics are being calculated in the upcoming phase.
          </p>
        </div>
      ) : loading ? (
        <div className="py-6 flex items-center justify-center gap-6">
          <div className="w-16 h-16 rounded-full bg-white/5 animate-pulse" />
          <div className="w-20 h-20 rounded-full bg-white/5 animate-pulse" />
          <div className="w-16 h-16 rounded-full bg-white/5 animate-pulse" />
        </div>
      ) : (
        <div className="pt-4 pb-2 flex items-end justify-center gap-4 sm:gap-8 md:gap-12">
          {/* RANK 2 (Silver) - LEFT */}
          {podium.second && (
            <Link
              href={podium.second.profileUrl}
              className="flex flex-col items-center space-y-1 group hover:scale-105 transition-transform"
            >
              {/* Crown Icon */}
              <span className="text-xl sm:text-2xl select-none leading-none drop-shadow">🥈</span>
              
              {/* Avatar + Silver Ring */}
              <div className="relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden ring-2 ring-slate-300 shadow-md">
                  <img
                    src={podium.second.avatarUrl}
                    alt={podium.second.nickname}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Silver Medal Badge */}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-slate-300 text-slate-900 font-black text-[10px] px-2 py-0.2 rounded-full shadow-md">
                  2
                </div>
              </div>

              {/* Nickname & Score */}
              <div className="text-center pt-1">
                <p className="text-[11px] sm:text-xs font-bold text-white truncate max-w-[80px]">
                  {podium.second.nickname}
                </p>
                <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-amber-300">
                  <span>🪙</span>
                  <span>{podium.second.scoreFormatted}</span>
                </div>
              </div>
            </Link>
          )}

          {/* RANK 1 (Gold) - CENTER & LARGEST */}
          {podium.first && (
            <Link
              href={podium.first.profileUrl}
              className="flex flex-col items-center space-y-1 group hover:scale-105 transition-transform -mt-3"
            >
              {/* Gold Crown */}
              <span className="text-2xl sm:text-3xl select-none leading-none drop-shadow-[0_4px_10px_rgba(245,158,11,0.5)] animate-bounce">
                👑
              </span>

              {/* Avatar + Golden Ring */}
              <div className="relative">
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full overflow-hidden ring-4 ring-amber-400 shadow-xl shadow-amber-500/20">
                  <img
                    src={podium.first.avatarUrl}
                    alt={podium.first.nickname}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Gold Medal Badge */}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 font-black text-xs px-2.5 py-0.5 rounded-full shadow-lg">
                  1
                </div>
              </div>

              {/* Nickname & Score */}
              <div className="text-center pt-1">
                <div className="flex items-center justify-center gap-1">
                  <p className="text-xs sm:text-sm font-extrabold text-white truncate max-w-[100px]">
                    {podium.first.nickname}
                  </p>
                  {podium.first.isVerified && (
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />
                  )}
                </div>
                <div className="flex items-center justify-center gap-1 text-xs font-extrabold text-amber-300">
                  <span>🪙</span>
                  <span>{podium.first.scoreFormatted}</span>
                </div>
              </div>
            </Link>
          )}

          {/* RANK 3 (Bronze) - RIGHT */}
          {podium.third && (
            <Link
              href={podium.third.profileUrl}
              className="flex flex-col items-center space-y-1 group hover:scale-105 transition-transform"
            >
              {/* Bronze Crown */}
              <span className="text-xl sm:text-2xl select-none leading-none drop-shadow">🥉</span>

              {/* Avatar + Bronze Ring */}
              <div className="relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden ring-2 ring-amber-600 shadow-md">
                  <img
                    src={podium.third.avatarUrl}
                    alt={podium.third.nickname}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Bronze Medal Badge */}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-amber-600 text-white font-black text-[10px] px-2 py-0.2 rounded-full shadow-md">
                  3
                </div>
              </div>

              {/* Nickname & Score */}
              <div className="text-center pt-1">
                <p className="text-[11px] sm:text-xs font-bold text-white truncate max-w-[80px]">
                  {podium.third.nickname}
                </p>
                <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-amber-300">
                  <span>🪙</span>
                  <span>{podium.third.scoreFormatted}</span>
                </div>
              </div>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
