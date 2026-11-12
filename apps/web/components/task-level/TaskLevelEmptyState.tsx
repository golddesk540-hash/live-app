'use client';

import React from 'react';
import {
  Award,
  CheckCircle2,
  Compass,
  History,
  Info,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LevelEmptyKind } from './types';

interface TaskLevelEmptyStateProps {
  kind: LevelEmptyKind;
  onAction: () => void;
  actionLabel?: string;
}

export const TaskLevelEmptyState: React.FC<TaskLevelEmptyStateProps> = ({
  kind,
  onAction,
  actionLabel,
}) => {
  const config: Record<
    LevelEmptyKind,
    { title: string; description: string; defaultCta: string; icon: React.ReactNode }
  > = {
    no_history: {
      title: 'No level history available',
      description:
        'Your sample level transition history is currently empty. Advance demo points across level thresholds or restore sample records.',
      defaultCta: 'Restore Sample History',
      icon: <History className="w-6 h-6 text-[#FF6BA3]" />,
    },
    no_benefits: {
      title: 'No sample benefits visible',
      description:
        'There are no placeholder level benefits matching your current filter. Show all levels or restore default benefits.',
      defaultCta: 'Show All Benefits',
      icon: <Award className="w-6 h-6 text-amber-300" />,
    },
    no_completed: {
      title: 'No completed levels yet',
      description:
        'At the current demo points total, no level milestone has reached 100% completion yet. Add demo points to unlock Level 01.',
      defaultCta: 'Show All Levels',
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-300" />,
    },
    no_upcoming: {
      title: 'No upcoming levels remaining',
      description:
        'All 5 sample demo tiers have been reached in this preview session. Reset points to inspect upcoming tier progression.',
      defaultCta: 'Reset to 650 Points',
      icon: <Compass className="w-6 h-6 text-amber-300" />,
    },
    no_level_details: {
      title: 'Level details not found',
      description:
        'The requested sample level item is unavailable. Return to the Task Level dashboard to select a tier.',
      defaultCta: 'Back to Dashboard',
      icon: <Info className="w-6 h-6 text-purple-200" />,
    },
  };

  const active = config[kind];

  return (
    <div
      data-testid={`task-level-empty-${kind}`}
      className="rounded-3xl bg-[#130728] border border-purple-400/20 px-6 py-10 text-center space-y-4 shadow-xl"
    >
      <div className="w-14 h-14 mx-auto rounded-2xl bg-[#1E0D3D] border border-purple-400/25 flex items-center justify-center">
        {active.icon}
      </div>
      <div className="space-y-1.5 max-w-md mx-auto">
        <h3 className="text-base font-extrabold text-white">{active.title}</h3>
        <p className="text-xs sm:text-sm text-purple-200/70 leading-relaxed">
          {active.description}
        </p>
      </div>
      <div className="flex justify-center pt-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          leftIcon={<RotateCcw className="w-3.5 h-3.5 text-[#FF6BA3]" />}
          onClick={onAction}
          data-testid={`task-level-empty-action-${kind}`}
          className="border-purple-400/35 bg-[#1B0B36] hover:bg-[#27114D] whitespace-nowrap"
        >
          {actionLabel || active.defaultCta}
        </Button>
      </div>
    </div>
  );
};
