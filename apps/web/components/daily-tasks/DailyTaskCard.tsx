'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  Eye,
  Flame,
  Gift,
  Lock,
  MessageSquareHeart,
  Play,
  Radio,
  Sparkles,
  Users,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { calculateTaskPercentage, TASK_STATUS_STYLES } from './mockDailyTasksData';
import { DailyTaskItem, TaskIconKey, TaskStatus } from './types';

export function renderTaskIcon(iconKey: TaskIconKey, className = 'w-4 h-4') {
  switch (iconKey) {
    case 'clock':
      return <Clock className={className} />;
    case 'gift':
      return <Gift className={className} />;
    case 'users':
      return <Users className={className} />;
    case 'radio':
      return <Radio className={className} />;
    case 'video':
      return <Video className={className} />;
    case 'message':
      return <MessageSquareHeart className={className} />;
    case 'flame':
      return <Flame className={className} />;
    case 'sparkles':
    default:
      return <Sparkles className={className} />;
  }
}

export function renderStatusGlyph(status: TaskStatus) {
  switch (status) {
    case 'Completed':
      return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
    case 'In Progress':
      return <Play className="w-4 h-4 text-[#FF6BA3] shrink-0" />;
    case 'Locked':
      return <Lock className="w-4 h-4 text-purple-200/50 shrink-0" />;
    case 'Not Started':
    default:
      return <Circle className="w-5 h-5 text-purple-300/45 shrink-0" />;
  }
}

interface DailyTaskCardProps {
  task: DailyTaskItem;
  onViewDetails: (taskId: string) => void;
  onIncrementProgress: (taskId: string) => void;
  onMarkComplete: (taskId: string) => void;
  onUnlockPreview?: (taskId: string) => void;
}

export const DailyTaskCard: React.FC<DailyTaskCardProps> = ({
  task,
  onViewDetails,
  onIncrementProgress,
  onMarkComplete,
  onUnlockPreview,
}) => {
  const [expanded, setExpanded] = useState(false);
  const percentage = calculateTaskPercentage(task);
  const statusStyle = TASK_STATUS_STYLES[task.status];

  return (
    <article
      data-testid={`daily-task-card-${task.id}`}
      className={`rounded-3xl bg-[#130728] border ${statusStyle.cardBorderClasses} p-4 sm:p-5 transition-all shadow-lg space-y-3.5`}
    >
      {/* Top Row: Icon + Title + Category + Status Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-[#1F0D3F] border border-purple-400/25 flex items-center justify-center text-[#FF6BA3] shrink-0 mt-0.5">
            {renderTaskIcon(task.iconKey, 'w-5 h-5')}
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-400/25 text-[10px] font-bold text-purple-200/85">
                {task.categoryLabel}
              </span>
              <span
                data-testid={`task-status-badge-${task.id}`}
                className={`px-2 py-0.5 rounded-full border text-[10px] font-extrabold ${statusStyle.badgeClasses}`}
              >
                {task.status}
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug">
              {task.title}
            </h3>
            <p className="text-xs text-purple-200/70 leading-relaxed">{task.description}</p>
          </div>
        </div>

        <div className="pt-1">{renderStatusGlyph(task.status)}</div>
      </div>

      {/* Progress Info Row + Bar */}
      <div className="space-y-1.5 pt-0.5">
        <div className="flex items-center justify-between text-xs font-bold">
          <span
            data-testid={`task-progress-text-${task.id}`}
            className="text-purple-100/85"
          >
            {task.status === 'Not Started' && task.currentProgress === 0
              ? `0 / ${task.targetProgress} ${task.unit} · Not started`
              : `${task.currentProgress} / ${task.targetProgress} ${task.unit}`}
          </span>
          <span
            data-testid={`task-percentage-${task.id}`}
            className={statusStyle.textAccentClass}
          >
            {percentage}%
          </span>
        </div>

        <div className="h-2.5 w-full rounded-full bg-[#241242] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${statusStyle.progressBarClasses}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {task.status === 'Locked' && task.unlockRequirementLabel && (
        <div className="rounded-xl bg-[#1A0C34] border border-white/10 px-3 py-2 text-[11px] text-purple-200/70 flex items-center justify-between gap-2">
          <span>{task.unlockRequirementLabel}</span>
          {onUnlockPreview && (
            <button
              type="button"
              onClick={() => onUnlockPreview(task.id)}
              data-testid={`task-unlock-preview-${task.id}`}
              className="text-[#FF85B3] font-bold hover:underline shrink-0"
            >
              Unlock Preview
            </button>
          )}
        </div>
      )}

      {/* Expandable Instructions & Quick Demo Preview */}
      {expanded && (
        <div
          data-testid={`task-expanded-panel-${task.id}`}
          className="rounded-2xl bg-[#1A0C34] border border-purple-400/20 p-3.5 space-y-3"
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-purple-200/70">
            Sample Task Instructions
          </p>
          <ul className="space-y-1.5 text-xs text-purple-100/80">
            {task.instructions.map((step, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-purple-500/20 text-[#FF6BA3] text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ul>

          {task.status !== 'Locked' && task.status !== 'Completed' && (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onIncrementProgress(task.id)}
                data-testid={`task-quick-increment-${task.id}`}
                className="text-xs border-purple-400/35 bg-[#231045] hover:bg-[#2F165C]"
              >
                +{task.stepIncrement} {task.unit} (Demo)
              </Button>
              <Button
                type="button"
                size="sm"
                variant="primary"
                onClick={() => onMarkComplete(task.id)}
                data-testid={`task-quick-complete-${task.id}`}
                className="text-xs"
              >
                Mark Complete (Demo)
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Footer Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-purple-400/15">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          data-testid={`task-expand-btn-${task.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-200/75 hover:text-white transition-colors py-1"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{expanded ? 'Hide Quick Preview' : 'Quick Preview'}</span>
        </button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          leftIcon={<Eye className="w-3.5 h-3.5 text-[#FF6BA3]" />}
          onClick={() => onViewDetails(task.id)}
          data-testid={`task-view-details-${task.id}`}
          className="border-purple-400/30 bg-[#1B0C36] hover:bg-[#281350] text-xs whitespace-nowrap"
        >
          View Details
        </Button>
      </div>
    </article>
  );
};
