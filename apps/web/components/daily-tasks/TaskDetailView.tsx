'use client';

import React from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Info,
  Lock,
  Plus,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { renderTaskIcon } from './DailyTaskCard';
import { calculateTaskPercentage, TASK_STATUS_STYLES } from './mockDailyTasksData';
import { DailyTaskItem } from './types';

interface TaskDetailViewProps {
  task: DailyTaskItem;
  onBack: () => void;
  onIncrementProgress: (taskId: string) => void;
  onMarkComplete: (taskId: string) => void;
  onResetTask: (taskId: string) => void;
  onUnlockPreview: (taskId: string) => void;
}

export const TaskDetailView: React.FC<TaskDetailViewProps> = ({
  task,
  onBack,
  onIncrementProgress,
  onMarkComplete,
  onResetTask,
  onUnlockPreview,
}) => {
  const percentage = calculateTaskPercentage(task);
  const statusStyle = TASK_STATUS_STYLES[task.status];

  return (
    <section
      data-testid="daily-task-detail-view"
      className="rounded-3xl bg-[#130728] border border-purple-400/25 p-5 sm:p-6 space-y-5 shadow-2xl"
    >
      {/* Back Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          data-testid="task-detail-back-btn"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1E0D3D] hover:bg-[#2B1554] border border-purple-400/25 text-xs font-bold text-purple-100 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Daily Tasks</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-400/25 text-[11px] font-bold text-purple-200">
            {task.categoryLabel}
          </span>
          <span
            data-testid="task-detail-status-badge"
            className={`px-2.5 py-1 rounded-full border text-[11px] font-extrabold ${statusStyle.badgeClasses}`}
          >
            {task.status}
          </span>
        </div>
      </div>

      {/* Title & Icon */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#1F0D3F] border border-purple-400/30 flex items-center justify-center text-[#FF6BA3] shrink-0">
          {renderTaskIcon(task.iconKey, 'w-6 h-6')}
        </div>

        <div className="space-y-1.5 min-w-0">
          <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
            {task.title}
          </h2>
          <p className="text-xs sm:text-sm text-purple-200/75 leading-relaxed">
            {task.description}
          </p>
        </div>
      </div>

      {/* Progress Breakdown Card */}
      <div className="rounded-2xl bg-[#1A0C34] border border-purple-400/20 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-purple-200/65">
              Sample Progress
            </p>
            <p
              data-testid="task-detail-progress-value"
              className="text-lg font-black text-white mt-0.5"
            >
              {task.currentProgress} / {task.targetProgress} {task.unit}
            </p>
          </div>

          <div className="text-right">
            <p className="text-[11px] font-bold uppercase tracking-wider text-purple-200/65">
              Completion
            </p>
            <p
              data-testid="task-detail-percentage"
              className={`text-lg font-black mt-0.5 ${statusStyle.textAccentClass}`}
            >
              {percentage}%
            </p>
          </div>
        </div>

        <div className="h-3 w-full rounded-full bg-[#2A154A] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${statusStyle.progressBarClasses}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-purple-200/70 pt-1">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#FF6BA3]" />
            <span>Task Date: {task.taskDate}</span>
          </span>
          {task.completedDate && (
            <span className="inline-flex items-center gap-1.5 text-amber-300 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completed: {task.completedDate}</span>
            </span>
          )}
        </div>
      </div>

      {/* Task Instructions */}
      <div className="space-y-2.5">
        <h3 className="text-sm font-extrabold text-white">Task Instructions (Sample Guide)</h3>
        <ul className="space-y-2">
          {task.instructions.map((item, idx) => (
            <li
              key={idx}
              className="rounded-2xl bg-[#180A30] border border-purple-400/15 px-3.5 py-2.5 text-xs text-purple-100/85 flex items-start gap-2.5"
            >
              <span className="w-5 h-5 rounded-full bg-[#FF1A6C]/20 border border-[#FF1A6C]/40 text-[#FF85B3] text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Frontend-only Notice */}
      <div className="rounded-2xl bg-[#180B32] border border-amber-400/25 px-3.5 py-2.5 text-[11px] text-purple-100/80 flex items-start gap-2">
        <Info className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
        <span>
          <strong className="text-amber-300">Frontend Preview Only:</strong> Sample task values are shown for UI verification. Real streaming analytics, gift tracking, and reward rules are not active in this phase.
        </span>
      </div>

      {/* Controlled Demo Interaction Controls */}
      <div className="pt-2 border-t border-purple-400/20 space-y-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-purple-200/65 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#FF6BA3]" />
          <span>Controlled Demo Interactions (Local UI State)</span>
        </p>

        {task.status === 'Locked' ? (
          <div className="rounded-2xl bg-[#190B34] border border-white/10 p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-purple-200/80">
              <Lock className="w-4 h-4 text-purple-300" />
              <span>{task.unlockRequirementLabel || 'Sample prerequisite required.'}</span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="primary"
              onClick={() => onUnlockPreview(task.id)}
              data-testid="task-detail-unlock-btn"
            >
              Preview Unlocked State
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {task.status !== 'Completed' && (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  leftIcon={<Plus className="w-3.5 h-3.5 text-[#FF6BA3]" />}
                  onClick={() => onIncrementProgress(task.id)}
                  data-testid="task-detail-increment-btn"
                  className="border-purple-400/35 bg-[#1D0C3D] hover:bg-[#2A1354] whitespace-nowrap"
                >
                  {`Add +${task.stepIncrement} ${task.unit} (Demo)`}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  onClick={() => onMarkComplete(task.id)}
                  data-testid="task-detail-complete-btn"
                  className="whitespace-nowrap"
                >
                  Mark Completed (Demo)
                </Button>
              </>
            )}

            <Button
              type="button"
              size="sm"
              variant="outline"
              leftIcon={<RotateCcw className="w-3.5 h-3.5 text-purple-300" />}
              onClick={() => onResetTask(task.id)}
              data-testid="task-detail-reset-btn"
              className="border-purple-400/25 bg-transparent hover:bg-white/5 whitespace-nowrap"
            >
              Reset Sample Task
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};
