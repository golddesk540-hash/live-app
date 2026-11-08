'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Crown,
  Trophy,
  Coins,
  ShieldCheck,
  Flame,
  Globe,
  Sparkles,
  ChevronRight,
  Heart,
} from 'lucide-react';
import { RankedUser } from '@/components/discovery/RankingPreviewSection';

export default function RankingPage() {
  const params = useParams();
  const router = useRouter();
  const categoryParam = (params?.category as string) || 'host';

  const [activeCategory, setActiveCategory] = useState(categoryParam);
  const [activePeriod, setActivePeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [rankings, setRankings] = useState<RankedUser[]>([]);
  const [podium, setPodium] = useState<{
    first: RankedUser | null;
    second: RankedUser | null;
    third: RankedUser | null;
  }>({ first: null, second: null, third: null });
  const [loading, setLoading] = useState(true);
  const [isComingSoon, setIsComingSoon] = useState(false);

  useEffect(() => {
    setActiveCategory(categoryParam);
  }, [categoryParam]);

  useEffect(() => {
    let isMounted = true;
    async function fetchRankings() {
      setLoading(true);
      try {
        const res = await fetch(`/api/discovery/rankings/preview?category=${activeCategory}&period=${activePeriod}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data.isComingSoon) {
              setIsComingSoon(true);
              setRankings([]);
              setPodium({ first: null, second: null, third: null });
            } else {
              setIsComingSoon(false);
              setRankings(data.rankings || []);
              setPodium(data.podium || { first: null, second: null, third: null });
            }
          }
        }
      } catch (err) {
        console.error('Failed to load ranking details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchRankings();
    return () => { isMounted = false; };
  }, [activeCategory, activePeriod]);

  const categories = [
    { id: 'host', label: '👑 Host Ranking' },
    { id: 'wealth', label: '💎 Wealth Ranking' },
    { id: 'popularity', label: '🔥 Popularity' },
    { id: 'country', label: '🌐 Country' },
    { id: 'gifts', label: '🎁 Gifts (Soon)' },
  ];

  return (
    <div className="min-h-screen bg-[#080915] text-white flex flex-col font-sans selection:bg-[#FF2E74] selection:text-white pb-16">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#0c0e1e]/90 backdrop-blur-xl border-b border-white/10 h-14 sm:h-16 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/live/explore')}
            aria-label="Back to discovery"
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
              Leaderboards & Rankings
            </h1>
          </div>
        </div>

        {/* PERIOD SELECTOR */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10 text-xs">
          {(['daily', 'weekly', 'monthly'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setActivePeriod(p)}
              className={`px-3 py-1 rounded-full capitalize font-bold transition-all ${
                activePeriod === p
                  ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </header>

      {/* CATEGORY TABS */}
      <div className="max-w-4xl mx-auto w-full px-4 pt-4 sm:pt-6">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setActiveCategory(c.id);
                router.replace(`/ranking/${c.id}`);
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                activeCategory === c.id
                  ? 'bg-white text-black shadow-lg font-black'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-4xl mx-auto w-full px-4 py-4 space-y-6">
        {isComingSoon ? (
          <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-white/5 space-y-3">
            <Sparkles className="w-10 h-10 text-pink-400/60 mx-auto animate-pulse" />
            <h2 className="text-base font-bold text-white">Gift Ranking Coming Soon</h2>
            <p className="text-xs text-white/50 max-w-sm mx-auto">
              Gift leaderboards will be activated during the Live Gifting Phase. Currently calculating streamer achievements.
            </p>
          </div>
        ) : loading ? (
          <div className="py-12 text-center text-white/50 text-xs animate-pulse">
            Loading real-time platform rankings...
          </div>
        ) : (
          <>
            {/* TOP 3 PODIUM */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1b1035] via-[#121324] to-[#1a0e2e] border border-purple-500/30 shadow-2xl flex items-end justify-center gap-4 sm:gap-10 pt-8 pb-6">
              {/* RANK 2 */}
              {podium.second && (
                <Link
                  href={podium.second.profileUrl}
                  className="flex flex-col items-center space-y-1.5 group hover:scale-105 transition-transform"
                >
                  <span className="text-2xl drop-shadow">🥈</span>
                  <div className="relative">
                    <img
                      src={podium.second.avatarUrl}
                      alt={podium.second.nickname}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-2 ring-slate-300 shadow-lg"
                    />
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-300 text-slate-900 font-black text-xs px-2.5 py-0.5 rounded-full shadow-md">
                      2
                    </span>
                  </div>
                  <div className="text-center pt-2">
                    <p className="text-xs sm:text-sm font-bold text-white truncate max-w-[100px]">
                      {podium.second.nickname}
                    </p>
                    <p className="text-xs font-extrabold text-amber-300">
                      🪙 {podium.second.scoreFormatted}
                    </p>
                  </div>
                </Link>
              )}

              {/* RANK 1 */}
              {podium.first && (
                <Link
                  href={podium.first.profileUrl}
                  className="flex flex-col items-center space-y-1.5 group hover:scale-105 transition-transform -mt-4"
                >
                  <span className="text-3xl sm:text-4xl drop-shadow-[0_4px_12px_rgba(245,158,11,0.6)] animate-bounce">
                    👑
                  </span>
                  <div className="relative">
                    <img
                      src={podium.first.avatarUrl}
                      alt={podium.first.nickname}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-amber-400 shadow-2xl shadow-amber-500/30"
                    />
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 font-black text-xs px-3 py-0.5 rounded-full shadow-lg">
                      1
                    </span>
                  </div>
                  <div className="text-center pt-2">
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-sm sm:text-base font-black text-white truncate max-w-[120px]">
                        {podium.first.nickname}
                      </p>
                      {podium.first.isVerified && (
                        <ShieldCheck className="w-4 h-4 text-sky-400 fill-sky-400" />
                      )}
                    </div>
                    <p className="text-sm font-black text-amber-300">
                      🪙 {podium.first.scoreFormatted}
                    </p>
                  </div>
                </Link>
              )}

              {/* RANK 3 */}
              {podium.third && (
                <Link
                  href={podium.third.profileUrl}
                  className="flex flex-col items-center space-y-1.5 group hover:scale-105 transition-transform"
                >
                  <span className="text-2xl drop-shadow">🥉</span>
                  <div className="relative">
                    <img
                      src={podium.third.avatarUrl}
                      alt={podium.third.nickname}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-2 ring-amber-600 shadow-lg"
                    />
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-600 text-white font-black text-xs px-2.5 py-0.5 rounded-full shadow-md">
                      3
                    </span>
                  </div>
                  <div className="text-center pt-2">
                    <p className="text-xs sm:text-sm font-bold text-white truncate max-w-[100px]">
                      {podium.third.nickname}
                    </p>
                    <p className="text-xs font-extrabold text-amber-300">
                      🪙 {podium.third.scoreFormatted}
                    </p>
                  </div>
                </Link>
              )}
            </div>

            {/* LEADERBOARD LIST (RANKS 4 TO 10+) */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-white/60 px-1">
                TOP BROADCASTERS (4 - {rankings.length})
              </h3>
              <div className="space-y-2">
                {rankings.slice(3).map((u) => (
                  <Link
                    key={u.id}
                    href={u.profileUrl}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 text-center font-black text-sm text-white/50 group-hover:text-white">
                        {u.rank}
                      </span>
                      <div className="relative w-10 h-10 rounded-full overflow-hidden ring-1 ring-white/10 shrink-0">
                        <img src={u.avatarUrl} alt={u.nickname} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-pink-300 transition-colors">
                            {u.nickname}
                          </p>
                          {u.isVerified && (
                            <ShieldCheck className="w-3.5 h-3.5 text-sky-400 fill-sky-400 shrink-0" />
                          )}
                          <span className="text-xs shrink-0">{u.flagEmoji}</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-mono">ID: {u.poppoId}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bold text-amber-300">
                      <span>🪙</span>
                      <span>{u.scoreFormatted}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
