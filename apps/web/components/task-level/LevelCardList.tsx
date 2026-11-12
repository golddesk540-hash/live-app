'use client';

import React from 'react';
import {
  Check,
  Circle,
  Crown,
  Eye,
  Flame,
  Lock,
  Sparkles,
  Sprout,
  Star,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LEVEL_STATUS_STYLES } from './mockTaskLevelData';
import { TaskLevelEmptyState } from './TaskLevelEmptyState';
import {
  ComputedTaskLevelItem,
  TaskLevelDefinition,
  TaskLevelFilterMode,
} from './types';

export function renderLevelIcon(
  iconKey: TaskLevelDefinition['iconKey'],
  className = 'w-5 h-5'
) {
  switch (iconKey) {
    case 'sprout':
      return <Sprout className={className} />;
    case 'zap':
      return <Zap className={className} />;
    case 'star':
      return <Star className={className} />;
    case 'flame':
      return <Flame className={className} />;
    case 'crown':
    default:
      return <Crown className={className} />;
  }
}

interface LevelCardListProps {
  levels: ComputedTaskLevelItem[];
  filterMode: TaskLevelFilterMode;
  onChangeFilter: (mode: TaskLevelFilterMode) => void;
  onSelectLevel: (levelId: string) => void;
  onResetDemoPoints: () => void;
}

export const LevelCardList: React.FC<LevelCardListProps> = ({
  levels,
  filterMode,
  onChangeFilter,
  onSelectLevel,
  onResetDemoPoints,
}) => {
  const visibleLevels =
    filterMode === 'all' ? levels : levels.filter((lvl) => lvl.status === filterMode);

  const filterModes: { id: TaskLevelFilterMode; label: string }[] = [
    { id: 'all', label: `All (${levels.length})` },
    { id: 'Completed', label: 'Completed' },
    { id: 'Current', label: 'Current' },
    { id: 'Upcoming', label: 'Upcoming' },
    { id: 'Locked', label: 'Locked' },
  ];

  return (
    <section data-testid="task-level-list-section" className="space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base sm:text-lg font-black text-white">Level Progress</h2>

        <div className="flex flex-wrap items-center gap-1.5">
          {filterModes.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => onChangeFilter(mode.id)}
              data-testid={`level-filter-${mode.id.toLowerCase()}`}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                filterMode === mode.id
                  ? 'bg-gradient-to-r from-[#FF1A6C] to-[#EC4899] text-white shadow-glow-pink'
                  : 'bg-[#190B32] border border-purple-400/20 text-purple-200/75 hover:text-white'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {visibleLevels.length === 0 ? (
        filterMode === 'Completed' ? (
          <TaskLevelEmptyState
            kind="no_completed"
            onAction={() => onChangeFilter('all')}
          />
        ) : filterMode === 'Upcoming' || filterMode === 'Locked' ? (
          <TaskLevelEmptyState
            kind="no_upcoming"
            onAction={() => {
              onResetDemoPoints();
              onChangeFilter('all');
            }}
          />
        ) : (
          <TaskLevelEmptyState
            kind="no_level_details"
            onAction={() => onChangeFilter('all')}
          />
        )
      ) : (
        <div className="space-y-3">
          {visibleLevels.map((lvl) => {
            const style = LEVEL_STATUS_STYLES[lvl.status];
            return (
              <article
                key={lvl.id}
                data-testid={`level-card-${lvl.id}`}
                className={`rounded-3xl bg-[#130728] border ${style.cardBorderClasses} p-4 sm:p-5 transition-all space-y-3 shadow-lg`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                        lvl.status === 'Current'
                          ? 'bg-amber-400/15 border-amber-400/45 text-amber-300'
                          : lvl.status === 'Completed'
                          ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                          : 'bg-[#1F0D3F] border-purple-400/25 text-[#FF6BA3]'
                      }`}
                    >
                      {renderLevelIcon(lvl.iconKey, 'w-5 h-5')}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-black text-amber-300">
                          {lvl.levelCode}
                        </span>
                        <span
                          data-testid={`level-status-${lvl.id}`}
                          className={`px-2 py-0.5 rounded-full border text-[10px] font-extrabold ${style.badgeClasses}`}
                        >
                          {lvl.status}
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-extrabold text-white">
                        {lvl.name}
                      </h3>

                      <p className="text-xs text-purple-200/75">
                        {lvl.targetPoints.toLocaleString()} sample points threshold
                        {lvl.status !== 'Completed' && lvl.remainingPoints > 0
                          ? ` · ${lvl.remainingPoints.toLocaleString()} remaining`
                          : ''}
                      </p>
                    </div>
                  </div>

                  {/* Right glyph matching 09_03_task_level.png */}
                  <div className="pt-1 shrink-0">
                    {lvl.status === 'Completed' ? (
                      <Check className="w-5 h-5 text-emerald-400" />
                    ) : lvl.status === 'Current' ? (
                      <Sparkles className="w-5 h-5 text-amber-300" />
                    ) : lvl.status === 'Locked' ? (
                      <Lock className="w-4 h-4 text-purple-200/50" />
                    ) : (
                      <Circle className="w-5 h-5 text-purple-300/45" />
                    )}
                  </div>
                </div>

                {/* Progress Bar + Details Button */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-purple-200/70">Tier Progress</span>
                      <span className="text-white">{lvl.progressPercent}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#241242] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${style.progressBarClasses}`}
                        style={{ width: `${lvl.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    leftIcon={<Eye className="w-3.5 h-3.5 text-[#FF6BA3]" />}
                    onClick={() => onSelectLevel(lvl.id)}
                    data-testid={`level-view-details-${lvl.id}`}
                    className="border-purple-400/30 bg-[#1B0C36] hover:bg-[#281350] text-xs whitespace-nowrap self-end sm:self-center"
                  >
                    Level Details
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
