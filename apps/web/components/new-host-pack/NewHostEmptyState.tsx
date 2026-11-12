'use client';

import React from 'react';
import { BookOpen, CheckCircle2, RotateCcw, SearchX, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PackEmptyKind } from './types';

interface NewHostEmptyStateProps {
  kind: PackEmptyKind;
  searchQuery?: string;
  onAction: () => void;
  actionLabel?: string;
}

export const NewHostEmptyState: React.FC<NewHostEmptyStateProps> = ({
  kind,
  searchQuery,
  onAction,
  actionLabel,
}) => {
  const config: Record<
    PackEmptyKind,
    { title: string; description: string; defaultCta: string; icon: React.ReactNode }
  > = {
    no_content: {
      title: 'No learning content available',
      description:
        'Your New-Host Pack guides are currently hidden in this preview. Restore sample creator guides to continue exploring.',
      defaultCta: 'Load Starter Pack Guides',
      icon: <BookOpen className="w-6 h-6 text-[#FF6BA3]" />,
    },
    no_completed: {
      title: 'No completed steps yet',
      description:
        'You have not marked any starter pack steps complete yet. Open a guide step to begin tracking your onboarding progress.',
      defaultCta: 'Explore Starter Guides',
      icon: <CheckCircle2 className="w-6 h-6 text-amber-300" />,
    },
    no_pending: {
      title: 'No pending steps remaining',
      description:
        'All sample onboarding steps in this New-Host Pack session are marked complete. Reset demo progress to test again.',
      defaultCta: 'Reset Demo Progress',
      icon: <Sparkles className="w-6 h-6 text-emerald-300" />,
    },
    no_search_results: {
      title: 'No matching guide steps found',
      description: searchQuery
        ? `No New-Host Pack steps matched "${searchQuery}". Try another keyword or clear your search filter.`
        : 'No New-Host Pack steps matched your current search filter.',
      defaultCta: 'Clear Search',
      icon: <SearchX className="w-6 h-6 text-[#FF6BA3]" />,
    },
  };

  const active = config[kind];

  return (
    <div
      data-testid={`new-host-empty-${kind}`}
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
          data-testid={`new-host-empty-action-${kind}`}
          className="border-purple-400/35 bg-[#1B0B36] hover:bg-[#27114D] whitespace-nowrap"
        >
          {actionLabel || active.defaultCta}
        </Button>
      </div>
    </div>
  );
};
