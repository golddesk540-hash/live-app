'use client';

import React from 'react';
import { ArrowRight, CalendarCheck2, Trophy } from 'lucide-react';
import { TaskLevelEmptyState } from './TaskLevelEmptyState';
import { TaskLevelHistoryRecord } from './types';

interface LevelHistorySectionProps {
  history: TaskLevelHistoryRecord[];
  onRestoreHistory: () => void;
}

export const LevelHistorySection: React.FC<LevelHistorySectionProps> = ({
  history,
  onRestoreHistory,
}) => {
  if (history.length === 0) {
    return <TaskLevelEmptyState kind="no_history" onAction={onRestoreHistory} />;
  }

  return (
    <section
      data-testid="level-history-section"
      className="space-y-3"
      aria-label="Level Achievement History"
    >
      {history.map((item) => (
        <article
          key={item.id}
          data-testid={`level-history-item-${item.id}`}
          className="rounded-3xl bg-[#130728] border border-purple-400/20 p-4 sm:p-5 space-y-2.5 shadow-lg"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-extrabold">
              <span className="text-purple-200/75">{item.previousLevelLabel}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#FF6BA3]" />
              <span className="text-amber-300">{item.newLevelLabel}</span>
            </div>

            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-[10px] font-extrabold text-emerald-300 inline-flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              <span>{item.achievementStatus}</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-purple-200/75">
            <span className="inline-flex items-center gap-1.5">
              <CalendarCheck2 className="w-3.5 h-3.5 text-[#FF6BA3]" />
              <span>Achievement Date: {item.achievementDate}</span>
            </span>
            <span className="font-bold text-white">
              Points at Achievement: {item.pointsAtAchievement.toLocaleString()} pts
            </span>
          </div>
        </article>
      ))}
    </section>
  );
};
