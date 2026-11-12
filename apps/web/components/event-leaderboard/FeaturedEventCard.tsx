'use client';

import React from 'react';
import { Calendar, Eye, Sparkles, Trophy, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EventRecord, EventStatus } from './types';

interface FeaturedEventCardProps {
  event: EventRecord;
  onViewDetails: (event: EventRecord) => void;
  onJumpToLeaderboard: (event: EventRecord) => void;
}

export function getEventStatusStyle(status: EventStatus): {
  label: string;
  bannerTag: string;
  classes: string;
} {
  if (status === 'live') {
    return {
      label: 'Live',
      bannerTag: 'LIVE EVENT',
      classes: 'bg-[#FF1A6C]/20 border-[#FF2E74]/50 text-pink-200',
    };
  }
  if (status === 'upcoming') {
    return {
      label: 'Upcoming',
      bannerTag: 'UPCOMING EVENT',
      classes: 'bg-sky-500/15 border-sky-400/45 text-sky-200',
    };
  }
  return {
    label: 'Completed',
    bannerTag: 'COMPLETED EVENT',
    classes: 'bg-emerald-500/15 border-emerald-400/45 text-emerald-200',
  };
}

export const FeaturedEventCard: React.FC<FeaturedEventCardProps> = ({
  event,
  onViewDetails,
  onJumpToLeaderboard,
}) => {
  const statusStyle = getEventStatusStyle(event.status);

  return (
    <section
      data-testid="featured-event-card"
      aria-label="Featured Event"
      className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#2C104F] via-[#1B0936] to-[#120624] border border-purple-400/30 shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
    >
      {/* Banner Visual */}
      <div className="relative h-36 sm:h-44 w-full overflow-hidden border-b border-purple-400/20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.bannerImageUrl}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#180730] via-[#180730]/45 to-transparent"
        />

        <div className="absolute top-3 left-4 right-4 flex flex-wrap items-center justify-between gap-2">
          <span
            data-testid="featured-event-status-badge"
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider backdrop-blur-md ${statusStyle.classes}`}
          >
            {event.status === 'live' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF2E74] animate-pulse" />
            )}
            <span>{statusStyle.bannerTag}</span>
          </span>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#120624]/80 border border-purple-400/25 text-[10px] font-bold text-purple-200">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>{event.category}</span>
          </span>
        </div>
      </div>

      {/* Event Summary Body */}
      <div className="p-4 sm:p-6 space-y-4">
        <div className="space-y-1.5">
          <h2
            data-testid="featured-event-title"
            className="text-xl sm:text-2xl font-black tracking-tight text-white"
          >
            {event.title}
          </h2>
          <p className="text-xs sm:text-sm text-purple-200/80 leading-relaxed">
            {event.shortDescription}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className="rounded-2xl bg-[#130728]/90 border border-purple-400/20 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-200/60 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#FF6BA3]" />
              <span>Event Period</span>
            </p>
            <p className="text-xs font-extrabold text-white mt-0.5 truncate">
              {event.startDate} – {event.endDate}
            </p>
          </div>

          <div className="rounded-2xl bg-[#130728]/90 border border-purple-400/20 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-200/60 flex items-center gap-1">
              <Users className="w-3 h-3 text-sky-300" />
              <span>Participants</span>
            </p>
            <p
              data-testid="featured-event-participants-count"
              className="text-xs font-extrabold text-white mt-0.5"
            >
              {event.participantCount} hosts
            </p>
          </div>

          <div className="col-span-2 sm:col-span-1 rounded-2xl bg-[#130728]/90 border border-purple-400/20 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-200/60 flex items-center gap-1">
              <Trophy className="w-3 h-3 text-amber-300" />
              <span>Total Sample Pts</span>
            </p>
            <p
              data-testid="featured-event-total-points"
              className="text-xs font-extrabold text-amber-300 mt-0.5"
            >
              {event.totalEventPoints.toLocaleString('en-US')} pts
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <Button
            type="button"
            size="sm"
            leftIcon={<Trophy className="w-3.5 h-3.5" />}
            onClick={() => onJumpToLeaderboard(event)}
            data-testid="featured-event-leaderboard-btn"
            className="bg-gradient-to-r from-[#FF1A6C] to-[#EC4899] shadow-glow-pink"
          >
            View Leaderboard
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            leftIcon={<Eye className="w-3.5 h-3.5 text-[#FF6BA3]" />}
            onClick={() => onViewDetails(event)}
            data-testid="featured-event-details-btn"
            className="border-purple-400/35 bg-[#1B0C36] hover:bg-[#27114D]"
          >
            View Details
          </Button>
        </div>
      </div>
    </section>
  );
};
