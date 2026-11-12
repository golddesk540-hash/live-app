'use client';

import React from 'react';
import { ArrowLeft, Calendar, Info, ListChecks, Sparkles, Trophy, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getEventStatusStyle } from './FeaturedEventCard';
import { EventRecord } from './types';

interface EventDetailsViewProps {
  event: EventRecord;
  onOpenLeaderboard: () => void;
  onBack: () => void;
}

export const EventDetailsView: React.FC<EventDetailsViewProps> = ({
  event,
  onOpenLeaderboard,
  onBack,
}) => {
  const statusStyle = getEventStatusStyle(event.status);

  return (
    <div data-testid="event-details-view" className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          size="sm"
          variant="outline"
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          onClick={onBack}
          data-testid="event-details-back-btn"
          className="border-purple-400/35 bg-[#1B0B36] hover:bg-[#27114D]"
        >
          Back to Event Leaderboard
        </Button>

        <span
          className={`px-3 py-1 rounded-full border text-[11px] font-black uppercase tracking-wider ${statusStyle.classes}`}
        >
          {statusStyle.label}
        </span>
      </div>

      <section className="overflow-hidden rounded-3xl bg-[#130728] border border-purple-400/25 shadow-2xl">
        {/* Full Event Banner */}
        <div className="relative h-44 sm:h-56 w-full border-b border-purple-400/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.bannerImageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#130728] via-transparent to-transparent"
          />
          <span className="absolute top-3 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#120624]/85 border border-purple-400/30 text-xs font-bold text-purple-100">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{event.category}</span>
          </span>
        </div>

        <div className="p-5 sm:p-7 space-y-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-1">
              Sample Event Information Preview
            </p>
            <h2
              data-testid="event-details-title"
              className="text-xl sm:text-2xl font-black text-white"
            >
              {event.title}
            </h2>
            <p
              data-testid="event-details-description"
              className="text-xs sm:text-sm text-purple-100/80 leading-relaxed mt-2"
            >
              {event.fullDescription}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-[#1B0B36] border border-purple-400/20 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-200/60">
                Start Date
              </p>
              <p className="text-xs sm:text-sm font-extrabold text-white mt-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#FF6BA3] shrink-0" />
                <span>{event.startDate}</span>
              </p>
            </div>

            <div className="rounded-2xl bg-[#1B0B36] border border-purple-400/20 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-200/60">
                End Date
              </p>
              <p className="text-xs sm:text-sm font-extrabold text-white mt-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-purple-300 shrink-0" />
                <span>{event.endDate}</span>
              </p>
            </div>

            <div className="rounded-2xl bg-[#1B0B36] border border-purple-400/20 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-200/60">
                Status
              </p>
              <p className="text-xs sm:text-sm font-extrabold text-white mt-1 capitalize">
                {statusStyle.label}
              </p>
            </div>

            <div className="rounded-2xl bg-[#1B0B36] border border-purple-400/20 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-200/60">
                Participants
              </p>
              <p className="text-xs sm:text-sm font-extrabold text-amber-300 mt-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>{event.participantCount} hosts</span>
              </p>
            </div>
          </div>

          {/* Event Rules Placeholder */}
          <div className="rounded-2xl bg-[#190A33] border border-purple-400/20 p-4 space-y-2.5">
            <div className="flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-[#FF6BA3]" />
              <h3 className="text-sm font-black text-white">
                Sample Event Rules (Placeholder)
              </h3>
            </div>
            <ul data-testid="event-details-rules" className="space-y-2 text-xs sm:text-sm text-purple-100/80">
              {event.rules.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-2 leading-relaxed">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#FF2E74] shrink-0" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-[#1A0B35]/80 border border-purple-400/20 p-3.5 flex items-start gap-2.5 text-xs text-purple-200/75">
            <Info className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
            <p>
              This Event Details screen presents sample frontend event content only. It does not
              connect to live event scoring or determine official eligibility or rewards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              type="button"
              size="md"
              leftIcon={<Trophy className="w-4 h-4" />}
              onClick={onOpenLeaderboard}
              data-testid="event-details-open-leaderboard-btn"
              className="bg-gradient-to-r from-[#FF1A6C] to-[#EC4899] shadow-glow-pink"
            >
              Open Event Leaderboard
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
