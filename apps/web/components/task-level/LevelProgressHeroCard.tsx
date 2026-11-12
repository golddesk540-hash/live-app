'use client';

import React from 'react';
import { ArrowRight, Plus, RotateCcw, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ComputedTaskLevelItem } from './types';

interface LevelProgressHeroCardProps {
  currentPoints: number;
  currentLevel: ComputedTaskLevelItem;
  nextLevel: ComputedTaskLevelItem | null;
  overallPercent: number;
  remainingToNext: number;
  onAddDemoPoints: (delta: number) => void;
  onResetDemoPoints: () => void;
  onInspectCurrentLevel: () => void;
}

export const LevelProgressHeroCard: React.FC<LevelProgressHeroCardProps> = ({
  currentPoints,
  currentLevel,
  nextLevel,
  overallPercent,
  remainingToNext,
  onAddDemoPoints,
  onResetDemoPoints,
  onInspectCurrentLevel,
}) => {
  const isMaxTier = currentPoints >= currentLevel.targetPoints && !nextLevel;

  return (
    <section
      data-testid="task-level-hero-card"
      className="rounded-3xl bg-gradient-to-br from-[#230E45] via-[#170932] to-[#120526] border border-purple-400/25 p-5 sm:p-6 shadow-2xl space-y-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-purple-200/70">
            CURRENT TASK LEVEL
          </p>
          <div className="flex flex-wrap items-baseline gap-2.5">
            <h2
              data-testid="current-level-code"
              className="text-3xl sm:text-4xl font-black tracking-tight text-amber-400 drop-shadow"
            >
              {currentLevel.levelCode.toUpperCase()}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-[10px] font-extrabold text-amber-300 uppercase">
              {isMaxTier ? 'Top Demo Tier' : 'Active Tier'}
            </span>
          </div>
          <p
            data-testid="current-level-name"
            className="text-base sm:text-lg font-extrabold text-white"
          >
            {currentLevel.name}
          </p>
        </div>

        <div className="text-left sm:text-right space-y-1">
          <span
            data-testid="task-level-progress-percent"
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FF1A6C]/20 border border-[#FF1A6C]/45 text-xs font-black text-[#FF85B3]"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{overallPercent}% Progress</span>
          </span>
          <p className="text-[11px] text-purple-200/70">
            {remainingToNext === 0
              ? 'Threshold reached in sample tier'
              : `${remainingToNext.toLocaleString()} points to ${currentLevel.levelCode} goal`}
          </p>
        </div>
      </div>

      {/* Animated Progress Bar + Points */}
      <div className="space-y-2">
        <div className="h-3.5 w-full rounded-full bg-[#2B174A] border border-purple-300/15 overflow-hidden p-0.5">
          <div
            data-testid="task-level-main-progress-bar"
            className="h-full rounded-full bg-gradient-to-r from-[#FF1A6C] via-[#EC4899] to-amber-300 transition-all duration-300 shadow-glow-pink"
            style={{ width: `${overallPercent}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
          <span data-testid="task-level-points-ratio" className="text-purple-100/90">
            {currentPoints.toLocaleString()} / {currentLevel.targetPoints.toLocaleString()} points
          </span>
          {nextLevel ? (
            <span
              data-testid="task-level-next-preview"
              className="text-amber-300 inline-flex items-center gap-1"
            >
              <span>
                Next Tier: {nextLevel.levelCode} · {nextLevel.name} (
                {nextLevel.targetPoints.toLocaleString()} pts)
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          ) : (
            <span className="text-emerald-300 inline-flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>All 5 sample tiers unlocked</span>
            </span>
          )}
        </div>
      </div>

      {/* Interactive Demo Points Controls */}
      <div className="pt-3 border-t border-purple-400/20 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="primary"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => onAddDemoPoints(150)}
            data-testid="demo-add-150-pts-btn"
            className="whitespace-nowrap"
          >
            +150 Demo Points
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            leftIcon={<Plus className="w-3.5 h-3.5 text-[#FF6BA3]" />}
            onClick={() => onAddDemoPoints(300)}
            data-testid="demo-add-300-pts-btn"
            className="border-purple-400/35 bg-[#1D0D3B] hover:bg-[#2A1554] whitespace-nowrap"
          >
            +300 Demo Points
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            leftIcon={<RotateCcw className="w-3.5 h-3.5 text-purple-300" />}
            onClick={onResetDemoPoints}
            data-testid="demo-reset-pts-btn"
            className="border-purple-400/25 bg-transparent hover:bg-white/5 whitespace-nowrap"
          >
            Reset (650)
          </Button>
        </div>

        <button
          type="button"
          onClick={onInspectCurrentLevel}
          data-testid="inspect-current-level-btn"
          className="text-xs font-bold text-[#FF85B3] hover:underline"
        >
          Inspect {currentLevel.levelCode} Details →
        </button>
      </div>
    </section>
  );
};
