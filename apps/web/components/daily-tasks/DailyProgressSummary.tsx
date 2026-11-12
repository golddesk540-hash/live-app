'use client';

import React from 'react';
import { Calendar, CheckCircle2, Flame, Layers, ListChecks } from 'lucide-react';
import { DailyTaskSummaryMetrics } from './types';

interface DailyProgressSummaryProps {
  summary: DailyTaskSummaryMetrics;
  sampleDate: string;
}

export const DailyProgressSummary: React.FC<DailyProgressSummaryProps> = ({
  summary,
  sampleDate,
}) => {
  return (
    <section
      data-testid="daily-tasks-progress-summary"
      className="space-y-4"
      aria-label="Today's Progress and Daily Summary"
    >
      {/* Hero Progress Card inspired directly by 09_02_daily_host_tasks.png */}
      <div className="rounded-3xl bg-gradient-to-br from-[#230E45] via-[#170932] to-[#120526] border border-purple-400/25 p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-[0.14em] text-purple-200/70">
              TODAY&apos;S PROGRESS
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-400/25 text-[10px] font-bold text-purple-200 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#FF6BA3]" />
              <span>{sampleDate}</span>
            </span>
          </div>

          <span
            data-testid="daily-tasks-overall-percent"
            className="px-2.5 py-1 rounded-full bg-[#FF1A6C]/20 border border-[#FF1A6C]/45 text-xs font-black text-[#FF85B3]"
          >
            {summary.overallPercentage}% Complete
          </span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p
              data-testid="daily-tasks-completed-ratio"
              className="text-xl sm:text-2xl font-black text-white tracking-tight"
            >
              {summary.completedTasks} of {summary.totalTasks} tasks complete
            </p>
            <p className="text-xs text-purple-200/65 mt-1">
              Sample daily activity tracking in local preview state
            </p>
          </div>
          <p className="text-xs font-bold text-amber-300/90">
            {summary.remainingTasks} remaining
          </p>
        </div>

        {/* Main Progress Bar */}
        <div className="h-3.5 w-full rounded-full bg-[#2B174A] border border-purple-300/15 overflow-hidden p-0.5">
          <div
            data-testid="daily-tasks-main-progress-bar"
            className="h-full rounded-full bg-gradient-to-r from-[#FF1A6C] via-[#EC4899] to-amber-300 transition-all duration-300 shadow-glow-pink"
            style={{ width: `${summary.overallPercentage}%` }}
          />
        </div>
      </div>

      {/* 4-Card Daily Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          data-testid="summary-card-total"
          className="rounded-2xl bg-[#130728] border border-purple-400/20 p-3.5 space-y-1"
        >
          <div className="flex items-center justify-between text-purple-200/65 text-[11px] font-bold">
            <span>Total Tasks</span>
            <Layers className="w-3.5 h-3.5 text-purple-300" />
          </div>
          <p className="text-lg sm:text-xl font-black text-white">{summary.totalTasks}</p>
        </div>

        <div
          data-testid="summary-card-completed"
          className="rounded-2xl bg-[#130728] border border-amber-400/25 p-3.5 space-y-1"
        >
          <div className="flex items-center justify-between text-amber-200/80 text-[11px] font-bold">
            <span>Completed</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
          </div>
          <p className="text-lg sm:text-xl font-black text-amber-300">
            {summary.completedTasks}
          </p>
        </div>

        <div
          data-testid="summary-card-in-progress"
          className="rounded-2xl bg-[#130728] border border-[#FF1A6C]/25 p-3.5 space-y-1"
        >
          <div className="flex items-center justify-between text-[#FF85B3] text-[11px] font-bold">
            <span>In Progress</span>
            <Flame className="w-3.5 h-3.5 text-[#FF6BA3]" />
          </div>
          <p className="text-lg sm:text-xl font-black text-[#FF85B3]">
            {summary.inProgressTasks}
          </p>
        </div>

        <div
          data-testid="summary-card-remaining"
          className="rounded-2xl bg-[#130728] border border-purple-400/20 p-3.5 space-y-1"
        >
          <div className="flex items-center justify-between text-purple-200/65 text-[11px] font-bold">
            <span>Remaining</span>
            <ListChecks className="w-3.5 h-3.5 text-purple-300" />
          </div>
          <p className="text-lg sm:text-xl font-black text-white">{summary.remainingTasks}</p>
        </div>
      </div>
    </section>
  );
};
