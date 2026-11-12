'use client';

import React from 'react';
import {
  CheckCircle2,
  ClipboardList,
  FolderOpen,
  RotateCcw,
  SearchX,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DailyTaskEmptyKind } from './types';

interface DailyTaskEmptyStateProps {
  kind: DailyTaskEmptyKind;
  categoryLabel?: string;
  searchQuery?: string;
  onAction: () => void;
  actionLabel?: string;
}

export const DailyTaskEmptyState: React.FC<DailyTaskEmptyStateProps> = ({
  kind,
  categoryLabel,
  searchQuery,
  onAction,
  actionLabel,
}) => {
  const config: Record<
    DailyTaskEmptyKind,
    {
      title: string;
      description: string;
      defaultCta: string;
      icon: React.ReactNode;
    }
  > = {
    no_tasks: {
      title: 'No daily tasks available',
      description:
        'Your sample daily host task list is currently empty. Restore sample tasks to preview daily goals and interactions.',
      defaultCta: 'Load Sample Tasks',
      icon: <ClipboardList className="w-6 h-6 text-purple-200" />,
    },
    no_completed: {
      title: 'No completed tasks yet',
      description:
        'None of today’s sample host tasks are marked complete yet. Update or complete an active task to inspect the completed view.',
      defaultCta: 'View Active Tasks',
      icon: <CheckCircle2 className="w-6 h-6 text-amber-300" />,
    },
    no_active: {
      title: 'No active tasks remaining',
      description:
        'All sample host tasks in today’s list have reached completed status. You can view completed tasks or reset the demo list.',
      defaultCta: 'View Completed Tasks',
      icon: <Sparkles className="w-6 h-6 text-emerald-300" />,
    },
    no_search_results: {
      title: 'No matching tasks found',
      description: searchQuery
        ? `No sample daily tasks matched "${searchQuery}". Try another keyword or clear your search filter.`
        : 'No sample daily tasks matched your current search query.',
      defaultCta: 'Clear Search',
      icon: <SearchX className="w-6 h-6 text-[#FF6BA3]" />,
    },
    no_category_tasks: {
      title: 'No tasks in selected category',
      description: categoryLabel
        ? `There are no tasks visible under ${categoryLabel} with the current status/search filters.`
        : 'No tasks match the selected category and filter combination.',
      defaultCta: 'Reset Category & Filters',
      icon: <FolderOpen className="w-6 h-6 text-purple-200" />,
    },
  };

  const activeConfig = config[kind];

  return (
    <div
      data-testid={`daily-tasks-empty-${kind}`}
      className="rounded-3xl bg-[#130728] border border-purple-400/20 px-6 py-10 text-center space-y-4 shadow-xl"
    >
      <div className="w-14 h-14 mx-auto rounded-2xl bg-[#1E0D3D] border border-purple-400/25 flex items-center justify-center">
        {activeConfig.icon}
      </div>
      <div className="space-y-1.5 max-w-md mx-auto">
        <h3 className="text-base font-extrabold text-white">{activeConfig.title}</h3>
        <p className="text-xs sm:text-sm text-purple-200/70 leading-relaxed">
          {activeConfig.description}
        </p>
      </div>
      <div className="pt-1 flex justify-center">
        <Button
          type="button"
          size="sm"
          variant="outline"
          leftIcon={<RotateCcw className="w-3.5 h-3.5 text-[#FF6BA3]" />}
          onClick={onAction}
          data-testid={`daily-tasks-empty-action-${kind}`}
          className="border-purple-400/35 bg-[#1B0B36] hover:bg-[#27114D] whitespace-nowrap"
        >
          {actionLabel || activeConfig.defaultCta}
        </Button>
      </div>
    </div>
  );
};
