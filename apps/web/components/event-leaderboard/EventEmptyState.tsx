'use client';

import React from 'react';
import { Calendar, CheckCircle2, Radio, RotateCcw, SearchX, Trophy, UserX } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EventEmptyKind } from './types';

interface EventEmptyStateProps {
  kind: EventEmptyKind;
  searchQuery?: string;
  onAction: () => void;
  actionLabel?: string;
  compact?: boolean;
}

export const EventEmptyState: React.FC<EventEmptyStateProps> = ({
  kind,
  searchQuery,
  onAction,
  actionLabel,
  compact = false,
}) => {
  const config: Record<
    EventEmptyKind,
    { title: string; description: string; defaultCta: string; icon: React.ReactNode }
  > = {
    no_events: {
      title: 'No events available',
      description:
        'Sample Popo Live events are hidden in this preview state. Restore events to browse creator leaderboards.',
      defaultCta: 'Restore Sample Events',
      icon: <Trophy className="w-6 h-6 text-amber-300" />,
    },
    no_upcoming: {
      title: 'No upcoming events',
      description:
        'There are currently no upcoming events matching this view. Restore sample events or switch event status.',
      defaultCta: 'Show All Events',
      icon: <Calendar className="w-6 h-6 text-sky-300" />,
    },
    no_live: {
      title: 'No live events',
      description:
        'No active live events are displayed right now in this preview. Restore sample live events to inspect rankings.',
      defaultCta: 'Restore Live Events',
      icon: <Radio className="w-6 h-6 text-[#FF6BA3]" />,
    },
    no_completed: {
      title: 'No completed events',
      description:
        'No archived completed events are shown in this preview. Restore sample events to view past leaderboards.',
      defaultCta: 'Show All Events',
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-300" />,
    },
    no_participants: {
      title: 'No leaderboard participants',
      description:
        'This event leaderboard has no participant entries in the current demo state. Restore sample participants to continue.',
      defaultCta: 'Restore Sample Participants',
      icon: <Trophy className="w-6 h-6 text-[#FF6BA3]" />,
    },
    no_search_results: {
      title: 'No search results',
      description: searchQuery
        ? `No event records or participants matched "${searchQuery}". Try another keyword or clear search.`
        : 'No matching event records or participants found.',
      defaultCta: 'Clear Search',
      icon: <SearchX className="w-6 h-6 text-[#FF6BA3]" />,
    },
    my_event_ranking_unavailable: {
      title: 'My Event Ranking unavailable',
      description:
        'Your demo participant position is hidden or unavailable for this event preview.',
      defaultCta: 'Restore My Event Ranking',
      icon: <UserX className="w-6 h-6 text-purple-300" />,
    },
  };

  const active = config[kind];

  return (
    <div
      data-testid={`event-empty-${kind}`}
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
          data-testid={`event-empty-action-${kind}`}
          className="border-purple-400/35 bg-[#1B0B36] hover:bg-[#27114D] whitespace-nowrap"
        >
          {actionLabel || active.defaultCta}
        </Button>
      </div>
    </div>
  );
};
