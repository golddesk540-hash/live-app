'use client';

import React from 'react';
import { CalendarCheck2, CheckCircle2, Eye, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { renderTaskIcon } from './DailyTaskCard';
import { DailyTaskEmptyState } from './DailyTaskEmptyState';
import { DailyTaskItem } from './types';

interface CompletedTasksSectionProps {
  tasks: DailyTaskItem[];
  onViewDetails: (taskId: string) => void;
  onResetTask: (taskId: string) => void;
  onSwitchToActive: () => void;
}

export const CompletedTasksSection: React.FC<CompletedTasksSectionProps> = ({
  tasks,
  onViewDetails,
  onResetTask,
  onSwitchToActive,
}) => {
  if (tasks.length === 0) {
    return (
      <DailyTaskEmptyState
        kind="no_completed"
        onAction={onSwitchToActive}
        actionLabel="Switch to Active Tasks"
      />
    );
  }

  return (
    <section
      data-testid="completed-tasks-section"
      className="space-y-3"
      aria-label="Completed Daily Host Tasks"
    >
      {tasks.map((task) => (
        <article
          key={task.id}
          data-testid={`completed-task-item-${task.id}`}
          className="rounded-3xl bg-[#130728] border border-amber-400/30 p-4 sm:p-5 space-y-3 shadow-lg"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/15 border border-amber-400/35 flex items-center justify-center text-amber-300 shrink-0">
                {renderTaskIcon(task.iconKey, 'w-5 h-5')}
              </div>

              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-400/25 text-[10px] font-bold text-purple-200">
                    {task.categoryLabel}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/45 text-[10px] font-extrabold text-amber-300">
                    Completed
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  {task.title}
                </h3>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-purple-200/75">
                  <span className="inline-flex items-center gap-1 text-emerald-300 font-bold">
                    <CalendarCheck2 className="w-3.5 h-3.5" />
                    <span>Completed on {task.completedDate || task.taskDate}</span>
                  </span>
                  <span>
                    {task.targetProgress} / {task.targetProgress} {task.unit}
                  </span>
                </div>
              </div>
            </div>

            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-1" />
          </div>

          <div className="h-2 w-full rounded-full bg-[#241242] overflow-hidden">
            <div className="h-full w-full rounded-full bg-gradient-to-r from-emerald-400 to-amber-300" />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              leftIcon={<RotateCcw className="w-3.5 h-3.5 text-purple-300" />}
              onClick={() => onResetTask(task.id)}
              data-testid={`completed-task-reset-${task.id}`}
              className="text-xs border-purple-400/25 bg-transparent hover:bg-white/5 whitespace-nowrap"
            >
              Reopen Demo
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              leftIcon={<Eye className="w-3.5 h-3.5 text-[#FF6BA3]" />}
              onClick={() => onViewDetails(task.id)}
              data-testid={`completed-task-details-${task.id}`}
              className="text-xs border-purple-400/35 bg-[#1B0C36] hover:bg-[#281350] whitespace-nowrap"
            >
              View Details
            </Button>
          </div>
        </article>
      ))}
    </section>
  );
};
