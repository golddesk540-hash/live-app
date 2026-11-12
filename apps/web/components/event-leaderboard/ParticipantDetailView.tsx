'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Info,
  MapPin,
  Radio,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatEventPoints } from './mockEventLeaderboardData';
import { EventParticipantRecord } from './types';

interface ParticipantDetailViewProps {
  participant: EventParticipantRecord;
  eventTitle: string;
  onBack: () => void;
}

export const ParticipantDetailView: React.FC<ParticipantDetailViewProps> = ({
  participant,
  eventTitle,
  onBack,
}) => {
  const ringByRank =
    participant.rank === 1
      ? 'vip'
      : participant.rank === 2
      ? 'seat'
      : participant.rank === 3
      ? 'pink'
      : 'none';

  const profileHref = participant.isCurrentUser
    ? '/profile'
    : `/search?q=${encodeURIComponent(participant.username)}`;

  return (
    <div data-testid="event-participant-detail-view" className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          size="sm"
          variant="outline"
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          onClick={onBack}
          data-testid="participant-detail-back-btn"
          className="border-purple-400/35 bg-[#1B0B36] hover:bg-[#27114D]"
        >
          Back to Leaderboard
        </Button>

        <span className="px-3 py-1 rounded-full bg-[#1C0D38] border border-purple-400/25 text-[11px] font-bold text-purple-200 inline-flex items-center gap-1.5 truncate max-w-[200px]">
          <Calendar className="w-3.5 h-3.5 text-[#FF6BA3] shrink-0" />
          <span className="truncate">{eventTitle}</span>
        </span>
      </div>

      <section className="rounded-3xl bg-gradient-to-br from-[#230E46] via-[#16082E] to-[#120624] border border-purple-400/30 p-5 sm:p-7 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Avatar
              src={participant.avatarUrl}
              alt={participant.username}
              size="xl"
              ring={ringByRank}
              isVIP={participant.rank === 1}
              level={participant.level}
            />
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  data-testid="participant-detail-username"
                  className="text-xl sm:text-2xl font-black text-white truncate"
                >
                  {participant.username}
                </h2>
                {participant.verified && (
                  <span
                    data-testid="participant-detail-verified-badge"
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-400/40 text-[11px] font-bold text-sky-300"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified Host</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-purple-200/75">
                <span>{participant.handle}</span>
                <span>·</span>
                <Badge variant="level" level={participant.level} size="xs" />
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#FF6BA3]" />
                  {participant.countryLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-[#110623]/95 border border-amber-400/35 px-4 py-3 text-center sm:min-w-[135px] shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-200/65">
              Event Rank
            </p>
            <p
              data-testid="participant-detail-rank"
              className="text-2xl sm:text-3xl font-black text-amber-300 mt-0.5"
            >
              #{participant.rank}
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-purple-100/80 leading-relaxed">{participant.bio}</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl bg-[#130728] border border-purple-400/20 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-200/60">
              Sample Event Points
            </p>
            <p
              data-testid="participant-detail-points"
              className="text-lg font-black text-amber-300 mt-1 flex items-center gap-1.5"
            >
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>{formatEventPoints(participant.eventPoints)}</span>
            </p>
          </div>

          <div className="rounded-2xl bg-[#130728] border border-purple-400/20 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-200/60">
              Participation Status
            </p>
            <p
              data-testid="participant-detail-status"
              className="text-lg font-black text-white mt-1"
            >
              {participant.participationStatus}
            </p>
          </div>

          <div className="rounded-2xl bg-[#130728] border border-purple-400/20 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-200/60">
              Event Movement
            </p>
            <div className="mt-1 text-lg font-black">
              {participant.movement === 'up' && (
                <span className="inline-flex items-center gap-1.5 text-emerald-300">
                  <TrendingUp className="w-4 h-4" />+{participant.movementDelta}{' '}
                  {participant.movementDelta === 1 ? 'Position' : 'Positions'}
                </span>
              )}
              {participant.movement === 'down' && (
                <span className="inline-flex items-center gap-1.5 text-rose-300">
                  <TrendingDown className="w-4 h-4" />-{participant.movementDelta}{' '}
                  {participant.movementDelta === 1 ? 'Position' : 'Positions'}
                </span>
              )}
              {participant.movement === 'same' && (
                <span className="text-purple-200/80">Steady</span>
              )}
              {participant.movement === 'new' && (
                <span className="text-pink-300">Registered Entry</span>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-[#1A0B35]/90 border border-purple-400/20 p-3.5 flex items-start gap-2.5 text-xs text-purple-200/75">
          <Info className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          <p>
            Event participant records use local frontend mock data only and do not represent live
            gifts, real earnings, or cash rewards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link href={profileHref} data-testid="participant-detail-view-profile-link">
            <Button
              type="button"
              size="md"
              rightIcon={<ExternalLink className="w-4 h-4" />}
              className="bg-gradient-to-r from-[#FF1A6C] to-[#EC4899] shadow-glow-pink"
            >
              {participant.isCurrentUser ? 'View My Profile' : 'View Profile'}
            </Button>
          </Link>

          <Link href="/live" data-testid="participant-detail-explore-live-link">
            <Button
              type="button"
              size="md"
              variant="outline"
              leftIcon={<Radio className="w-4 h-4 text-[#FF6BA3]" />}
              className="border-purple-400/35 bg-[#1B0C36] hover:bg-[#27114D]"
            >
              Explore Live Rooms
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};
