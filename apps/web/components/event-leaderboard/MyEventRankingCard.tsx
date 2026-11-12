'use client';

import React from 'react';
import { ArrowRight, Crown, ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EventEmptyState } from './EventEmptyState';
import { formatEventPoints } from './mockEventLeaderboardData';
import { EventParticipantRecord } from './types';

interface MyEventRankingCardProps {
  myEntry: EventParticipantRecord | null;
  eventTitle: string;
  onInspectMyRanking: (participant: EventParticipantRecord) => void;
  onRestoreMyRanking: () => void;
  testIdPrefix?: string;
}

export const MyEventRankingCard: React.FC<MyEventRankingCardProps> = ({
  myEntry,
  eventTitle,
  onInspectMyRanking,
  onRestoreMyRanking,
  testIdPrefix = '',
}) => {
  if (!myEntry) {
    return (
      <section
        data-testid={`${testIdPrefix}my-event-ranking-section`}
        aria-label="My Event Ranking"
      >
        <EventEmptyState
          kind="my_event_ranking_unavailable"
          onAction={onRestoreMyRanking}
          compact
        />
      </section>
    );
  }

  return (
    <section
      data-testid={`${testIdPrefix}my-event-ranking-section`}
      aria-label="My Event Ranking"
      className="rounded-3xl bg-gradient-to-br from-[#230E46] via-[#170931] to-[#120624] border border-[#FF2E74]/35 p-4 sm:p-5 shadow-[0_0_28px_rgba(255,46,116,0.14)] space-y-4"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Crown className="w-4 h-4 text-[#FF6BA3] shrink-0" />
          <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-purple-100 truncate">
            My Event Ranking
          </h2>
        </div>
        <span
          data-testid={`${testIdPrefix}my-event-name-badge`}
          className="px-2.5 py-0.5 rounded-full bg-[#FF1A6C]/20 border border-[#FF1A6C]/45 text-[10px] font-black text-pink-200 truncate max-w-[155px]"
        >
          {eventTitle}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar src={myEntry.avatarUrl} alt={myEntry.username} size="md" ring="pink" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="text-sm sm:text-base font-black text-white truncate">
                {myEntry.username}
              </p>
              {myEntry.verified && (
                <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
              )}
            </div>
            <p className="text-xs text-purple-200/70 truncate">
              {myEntry.handle} · {myEntry.participationStatus}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-purple-200/60">
            Event Rank
          </p>
          <p
            data-testid={`${testIdPrefix}my-event-position`}
            className="text-xl sm:text-2xl font-black text-amber-300 leading-tight"
          >
            #{myEntry.rank}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 rounded-2xl bg-[#110623]/90 border border-purple-400/20 p-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-purple-200/60">
            Sample Event Pts
          </p>
          <p
            data-testid={`${testIdPrefix}my-event-points`}
            className="text-sm font-black text-white mt-0.5"
          >
            {formatEventPoints(myEntry.eventPoints)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-purple-200/60">
            Movement
          </p>
          <div
            data-testid={`${testIdPrefix}my-event-movement`}
            className="mt-0.5 inline-flex items-center justify-end gap-1 text-xs font-black"
          >
            {myEntry.movement === 'up' && (
              <span className="inline-flex items-center gap-1 text-emerald-300">
                <TrendingUp className="w-3.5 h-3.5" />+{myEntry.movementDelta} rank
              </span>
            )}
            {myEntry.movement === 'down' && (
              <span className="inline-flex items-center gap-1 text-rose-300">
                <TrendingDown className="w-3.5 h-3.5" />-{myEntry.movementDelta} rank
              </span>
            )}
            {myEntry.movement === 'same' && (
              <span className="text-purple-200/70">Steady</span>
            )}
            {myEntry.movement === 'new' && (
              <span className="text-pink-300">Registered</span>
            )}
          </div>
        </div>
      </div>

      <Button
        type="button"
        size="sm"
        variant="outline"
        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
        onClick={() => onInspectMyRanking(myEntry)}
        data-testid={`${testIdPrefix}my-event-details-btn`}
        className="w-full border-purple-400/35 bg-[#1B0C36] hover:bg-[#28134E] text-white"
      >
        View My Event Details
      </Button>
    </section>
  );
};
