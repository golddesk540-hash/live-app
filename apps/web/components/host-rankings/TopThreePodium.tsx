'use client';

import React from 'react';
import { Award, Crown, Medal, ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { formatFullPoints, formatShortPoints } from './mockHostRankingsData';
import { HostRankingEntry } from './types';

interface TopThreePodiumProps {
  entries: HostRankingEntry[];
  onSelectHost: (entry: HostRankingEntry) => void;
}

export const TopThreePodium: React.FC<TopThreePodiumProps> = ({ entries, onSelectHost }) => {
  const first = entries[0] ?? null;
  const second = entries[1] ?? null;
  const third = entries[2] ?? null;

  if (!first && !second && !third) {
    return null;
  }

  const renderMovement = (entry: HostRankingEntry) => {
    if (entry.movement === 'up') {
      return (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-300">
          <TrendingUp className="w-3 h-3" />+{entry.movementDelta}
        </span>
      );
    }
    if (entry.movement === 'down') {
      return (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-300">
          <TrendingDown className="w-3 h-3" />-{entry.movementDelta}
        </span>
      );
    }
    if (entry.movement === 'new') {
      return (
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-pink-300">
          NEW
        </span>
      );
    }
    return <span className="text-[10px] font-semibold text-purple-200/50">—</span>;
  };

  return (
    <section
      data-testid="top-three-podium"
      aria-label="Top Three Hosts Podium"
      className="relative overflow-hidden rounded-[28px] bg-gradient-to-b from-[#230E45] via-[#170931] to-[#120624] border border-purple-400/25 p-4 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
    >
      {/* Subtle luxury glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 w-56 h-32 rounded-full bg-amber-400/15 blur-3xl"
      />

      <div className="relative flex items-center justify-between gap-2 mb-5">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-300" />
          <h2 className="text-sm sm:text-base font-black tracking-tight text-white">
            Top Three Hosts
          </h2>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-[#241145] border border-purple-400/25 text-[10px] font-bold text-purple-200/80">
          Tap host for ranking details
        </span>
      </div>

      {/* Podium Stage: Rank 2 (Silver Left) | Rank 1 (Gold Center Elevated) | Rank 3 (Bronze Right) */}
      <div className="relative grid grid-cols-3 gap-2.5 sm:gap-4 items-end pt-3">
        {/* RANK 2 - SILVER */}
        {second ? (
          <button
            type="button"
            onClick={() => onSelectHost(second)}
            data-testid="podium-card-rank-2"
            className="group flex flex-col items-center text-center focus:outline-none"
          >
            <div className="relative mb-2.5 transition-transform group-hover:-translate-y-0.5">
              <div className="p-0.5 rounded-full bg-gradient-to-tr from-slate-400 via-slate-100 to-slate-400 shadow-[0_0_20px_rgba(203,213,225,0.28)]">
                <Avatar src={second.avatarUrl} alt={second.username} size="md" className="sm:hidden" />
                <Avatar src={second.avatarUrl} alt={second.username} size="lg" className="hidden sm:inline-flex" />
              </div>
              <span
                aria-label="Rank 2 Silver"
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-slate-200 to-slate-400 text-slate-950 text-[10px] font-black shadow-md border border-white/60 whitespace-nowrap"
              >
                <Medal className="w-2.5 h-2.5" />2
              </span>
            </div>

            <div className="w-full rounded-2xl bg-[#241046]/90 group-hover:bg-[#2E1659] border border-slate-300/25 px-2 py-3 sm:px-3 sm:py-4 transition-colors min-h-[106px] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-center gap-1 min-w-0">
                  <p className="text-xs sm:text-sm font-extrabold text-white truncate">
                    {second.shortName}
                  </p>
                  {second.verified && (
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-purple-200/60 truncate hidden sm:block">
                  {second.handle}
                </p>
              </div>
              <div className="pt-1.5 space-y-0.5">
                <p
                  className="text-xs sm:text-sm font-black text-amber-300"
                  title={formatFullPoints(second.points)}
                >
                  {formatShortPoints(second.points)} pts
                </p>
                {renderMovement(second)}
              </div>
            </div>
          </button>
        ) : (
          <div />
        )}

        {/* RANK 1 - GOLD (Prominent Center) */}
        {first ? (
          <button
            type="button"
            onClick={() => onSelectHost(first)}
            data-testid="podium-card-rank-1"
            className="group flex flex-col items-center text-center -mt-4 focus:outline-none"
          >
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/50 text-[10px] font-black text-amber-200 uppercase tracking-wider mb-1.5 shadow-[0_0_16px_rgba(251,191,36,0.3)]">
              <Crown className="w-3 h-3 text-amber-300" />
              <span>1st Place</span>
            </div>

            <div className="relative mb-3 transition-transform group-hover:-translate-y-0.5">
              <div className="p-[3px] rounded-full bg-gradient-to-tr from-[#FFD700] via-[#FFF099] to-[#FF9500] shadow-[0_0_28px_rgba(255,215,0,0.45)]">
                <Avatar src={first.avatarUrl} alt={first.username} size="lg" className="sm:hidden" />
                <Avatar src={first.avatarUrl} alt={first.username} size="xl" className="hidden sm:inline-flex" />
              </div>
              <span
                aria-label="Rank 1 Gold"
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#FFD700] to-[#F59E0B] text-amber-950 text-[11px] font-black shadow-lg border border-amber-100 whitespace-nowrap"
              >
                <Crown className="w-3 h-3" />1
              </span>
            </div>

            <div className="w-full rounded-2xl bg-gradient-to-b from-[#331663] to-[#230E46] group-hover:from-[#3D1B75] group-hover:to-[#291152] border border-amber-300/45 px-2.5 py-3.5 sm:px-4 sm:py-4 transition-all min-h-[124px] flex flex-col justify-between shadow-[0_12px_30px_rgba(251,191,36,0.16)]">
              <div>
                <div className="flex items-center justify-center gap-1 min-w-0">
                  <p className="text-xs sm:text-base font-black text-white truncate">
                    {first.shortName}
                  </p>
                  {first.verified && (
                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] sm:text-xs text-amber-200/75 truncate hidden sm:block">
                  {first.handle}
                </p>
              </div>
              <div className="pt-2 space-y-0.5">
                <p
                  className="text-sm sm:text-base font-black text-amber-300"
                  title={formatFullPoints(first.points)}
                >
                  {formatShortPoints(first.points)} pts
                </p>
                {renderMovement(first)}
              </div>
            </div>
          </button>
        ) : (
          <div />
        )}

        {/* RANK 3 - BRONZE */}
        {third ? (
          <button
            type="button"
            onClick={() => onSelectHost(third)}
            data-testid="podium-card-rank-3"
            className="group flex flex-col items-center text-center focus:outline-none"
          >
            <div className="relative mb-2.5 transition-transform group-hover:-translate-y-0.5">
              <div className="p-0.5 rounded-full bg-gradient-to-tr from-[#B45309] via-[#FDBA74] to-[#92400E] shadow-[0_0_20px_rgba(217,119,6,0.28)]">
                <Avatar src={third.avatarUrl} alt={third.username} size="md" className="sm:hidden" />
                <Avatar src={third.avatarUrl} alt={third.username} size="lg" className="hidden sm:inline-flex" />
              </div>
              <span
                aria-label="Rank 3 Bronze"
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#EA580C] to-[#B45309] text-white text-[10px] font-black shadow-md border border-amber-200/40 whitespace-nowrap"
              >
                <Award className="w-2.5 h-2.5" />3
              </span>
            </div>

            <div className="w-full rounded-2xl bg-[#241046]/90 group-hover:bg-[#2E1659] border border-amber-600/35 px-2 py-3 sm:px-3 sm:py-4 transition-colors min-h-[100px] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-center gap-1 min-w-0">
                  <p className="text-xs sm:text-sm font-extrabold text-white truncate">
                    {third.shortName}
                  </p>
                  {third.verified && (
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-purple-200/60 truncate hidden sm:block">
                  {third.handle}
                </p>
              </div>
              <div className="pt-1.5 space-y-0.5">
                <p
                  className="text-xs sm:text-sm font-black text-amber-300"
                  title={formatFullPoints(third.points)}
                >
                  {formatShortPoints(third.points)} pts
                </p>
                {renderMovement(third)}
              </div>
            </div>
          </button>
        ) : (
          <div />
        )}
      </div>
    </section>
  );
};
