'use client';

import React from 'react';
import { Calendar, RotateCcw, SearchX, Trophy, UserX } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { RankingEmptyKind } from './types';

interface HostRankingEmptyStateProps {
  kind: RankingEmptyKind;
  searchQuery?: string;
  onAction: () => void;
  actionLabel?: string;
  compact?: boolean;
}

export const HostRankingEmptyState: React.FC<HostRankingEmptyStateProps> = ({
  kind,
  searchQuery,
  onAction,
  actionLabel,
  compact = false,
}) => {
  const config: Record<
    RankingEmptyKind,
    { title: string; description: string; defaultCta: string; icon: React.ReactNode }
  > = {
    no_data: {
      title: 'No ranking data available',
      description:
        'Host leaderboard entries are currently hidden in this frontend preview. Restore sample rankings to inspect the leaderboard.',
      defaultCta: 'Restore Sample Rankings',
      icon: <Trophy className="w-6 h-6 text-amber-300" />,
    },
    no_hosts_found: {
      title: 'No hosts found',
      description: searchQuery
        ? `No host rankings matched "${searchQuery}". Try another name or clear your search filter.`
        : 'No host records matched your active filters in this ranking period.',
      defaultCta: 'Reset Search & Filters',
      icon: <SearchX className="w-6 h-6 text-[#FF6BA3]" />,
    },
    no_daily: {
      title: 'No daily ranking records',
      description:
        'Sample daily host ranking entries are cleared for this preview state. Reload daily sample data to continue testing.',
      defaultCta: 'Load Daily Rankings',
      icon: <Calendar className="w-6 h-6 text-[#FF6BA3]" />,
    },
    no_weekly: {
      title: 'No weekly ranking records',
      description:
        'Sample weekly host ranking entries are cleared for this preview state. Reload weekly sample data to continue testing.',
      defaultCta: 'Load Weekly Rankings',
      icon: <Calendar className="w-6 h-6 text-purple-300" />,
    },
    no_monthly: {
      title: 'No monthly ranking records',
      description:
        'Sample monthly host ranking entries are cleared for this preview state. Reload monthly sample data to continue testing.',
      defaultCta: 'Load Monthly Rankings',
      icon: <Calendar className="w-6 h-6 text-amber-300" />,
    },
    my_ranking_unavailable: {
      title: 'My Ranking unavailable',
      description:
        'Your demo host position is hidden for this preview state or unavailable in the current period view.',
      defaultCta: 'Restore My Ranking',
      icon: <UserX className="w-6 h-6 text-purple-300" />,
    },
  };

  const active = config[kind];

  return (
    <div
      data-testid={`host-rankings-empty-${kind}`}
      className={`rounded-3xl bg-[#130728] border border-purple-400/20 text-center space-y-3 shadow-xl ${
        compact ? 'px-4 py-6' : 'px-6 py-10'
      }`}
    >
      <div
        className={`${
          compact ? 'w-11 h-11' : 'w-14 h-14'
        } mx-auto rounded-2xl bg-[#1E0D3D] border border-purple-400/25 flex items-center justify-center`}
      >
        {active.icon}
      </div>
      <div className="space-y-1 max-w-md mx-auto">
        <h3 className="text-sm sm:text-base font-extrabold text-white">{active.title}</h3>
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
          data-testid={`host-rankings-empty-action-${kind}`}
          className="border-purple-400/35 bg-[#1B0B36] hover:bg-[#27114D] whitespace-nowrap"
        >
          {actionLabel || active.defaultCta}
        </Button>
      </div>
    </div>
  );
};
