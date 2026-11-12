'use client';

import React from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  ListTodo,
  MapPin,
  Radio,
  ShieldCheck,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { AgencyHostRecord, AgencyHostStatus, AgencyProfileData } from './types';

interface HostDetailViewProps {
  host: AgencyHostRecord;
  agency: AgencyProfileData;
  onBack: () => void;
}

export function getHostStatusBadgeStyle(status: AgencyHostStatus): string {
  switch (status) {
    case 'Active':
      return 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300';
    case 'Pending':
      return 'bg-amber-400/20 border-amber-300/40 text-amber-200';
    case 'Inactive':
      return 'bg-slate-500/20 border-slate-400/35 text-slate-300';
    case 'Suspended':
      return 'bg-rose-500/20 border-rose-400/40 text-rose-300';
  }
}

export const HostDetailView: React.FC<HostDetailViewProps> = ({ host, agency, onBack }) => {
  const statusPill = getHostStatusBadgeStyle(host.status);

  return (
    <div className="space-y-4" data-testid="host-detail-view">
      {/* Top Breadcrumb Back */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          data-testid="host-detail-back-btn"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#1D0D34] hover:bg-[#271246] border border-purple-400/25 text-xs font-bold text-purple-100 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Host Management
        </button>

        <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-purple-500/15 border border-purple-400/25 text-purple-200">
          Host ID: {host.hostId}
        </span>
      </div>

      {/* Main Profile Summary Card */}
      <div className="rounded-3xl bg-[#1A0B2E] border border-purple-400/25 p-5 sm:p-6 shadow-[0_18px_46px_rgba(9,3,22,0.55)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar
              src={host.avatarUrl}
              alt={host.username}
              size="lg"
              ring="pink"
              className="shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  data-testid="host-detail-name"
                  className="text-xl font-black text-white truncate"
                >
                  {host.username}
                </h2>
                {host.verified && (
                  <span
                    data-testid="host-detail-verified-badge"
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/35 text-[10px] font-bold text-sky-300 whitespace-nowrap"
                  >
                    <ShieldCheck className="w-3 h-3" />
                    Verified Host
                  </span>
                )}
                <span
                  data-testid="host-detail-status"
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${statusPill}`}
                >
                  {host.status === 'Suspended' ? 'Suspended (Demo)' : host.status}
                </span>
              </div>
              <p className="text-xs text-purple-200/75 mt-1">
                {host.handle} ·{' '}
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#FF6BA3]" />
                  {host.countryLabel}
                </span>
              </p>
              <p className="text-xs text-purple-100/85 mt-2 leading-relaxed max-w-2xl">
                {host.bio}
              </p>
            </div>
          </div>
        </div>

        {/* Agency Membership & Joining Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-white/10">
          <div className="rounded-2xl bg-[#120624]/85 border border-purple-400/15 p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-300/65">
              <Building2 className="w-3.5 h-3.5 text-[#FF6BA3]" />
              Agency Membership
            </div>
            <div className="text-sm font-bold text-white mt-1.5">{agency.agencyName}</div>
            <div className="text-[11px] text-purple-200/70 mt-0.5">
              {agency.agencyId} · {host.membershipRole}
            </div>
          </div>

          <div className="rounded-2xl bg-[#120624]/85 border border-purple-400/15 p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-300/65">
              <Calendar className="w-3.5 h-3.5 text-amber-300" />
              Joining Date
            </div>
            <div className="text-sm font-bold text-white mt-1.5">{host.joiningDate}</div>
            <div className="text-[11px] text-purple-200/70 mt-0.5">{host.activityStatusLabel}</div>
          </div>

          <div className="rounded-2xl bg-[#120624]/85 border border-purple-400/15 p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-300/65">
              <Activity className="w-3.5 h-3.5 text-emerald-300" />
              Participation Index (Sample)
            </div>
            <div className="text-sm font-bold text-emerald-300 mt-1.5">
              {host.sampleParticipationScore}% activity match
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 mt-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FF2E93] to-amber-300"
                style={{ width: `${Math.max(4, host.sampleParticipationScore)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Connected Daily Task & Task Level Cards (Reusable Module References) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-3xl bg-[#1A0B2E] border border-purple-400/20 p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#FF2E93]/15 border border-[#FF2E93]/35 flex items-center justify-center">
                <ListTodo className="w-4 h-4 text-[#FF6BA3]" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Daily Task Status</h3>
                <p className="text-[11px] text-purple-200/70">Linked Phase 9.2 status summary</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-400/25 text-[11px] font-bold text-purple-100">
              <CheckCircle2 className="w-3 h-3 text-emerald-300" />
              {host.dailyTaskStatusLabel}
            </span>
          </div>

          <div className="mt-4 rounded-2xl bg-[#120624]/85 border border-purple-400/15 p-3.5 flex items-center justify-between gap-2">
            <span className="text-xs text-purple-100 font-semibold">
              {host.dailyTaskProgressLabel}
            </span>
            <Link
              href="/daily-tasks"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#FF6BA3] hover:underline"
            >
              Open Daily Tasks
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="rounded-3xl bg-[#1A0B2E] border border-purple-400/20 p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-400/15 border border-amber-400/35 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Task Level Progress</h3>
                <p className="text-[11px] text-purple-200/70">Linked Phase 9.3 creator tier</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/35 text-[11px] font-bold text-amber-200">
              <Trophy className="w-3 h-3 text-amber-300" />
              {host.taskLevelCode}
            </span>
          </div>

          <div className="mt-4 rounded-2xl bg-[#120624]/85 border border-purple-400/15 p-3.5 flex items-center justify-between gap-2">
            <span className="text-xs text-purple-100 font-semibold">
              Tier: {host.taskLevelName}
            </span>
            <Link
              href="/task-level"
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 hover:underline"
            >
              View Task Level
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Sample Activity Summary */}
      <div className="rounded-3xl bg-[#1A0B2E] border border-purple-400/20 p-5">
        <h3 className="text-sm font-black text-white mb-3">
          Sample Weekly Activity Summary (Non-Financial)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl bg-[#120624]/85 border border-purple-400/15 p-3.5">
            <div className="flex items-center gap-1.5 text-[11px] text-purple-300/70">
              <Radio className="w-3.5 h-3.5 text-[#FF6BA3]" />
              Sample Live Sessions
            </div>
            <div className="text-xl font-black text-white mt-1">
              {host.sampleSessionsThisWeek} sessions
            </div>
          </div>

          <div className="rounded-2xl bg-[#120624]/85 border border-purple-400/15 p-3.5">
            <div className="flex items-center gap-1.5 text-[11px] text-purple-300/70">
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              Sample Stream Hours
            </div>
            <div className="text-xl font-black text-white mt-1">
              {host.sampleLiveHours.toFixed(1)} hrs
            </div>
          </div>

          <div className="rounded-2xl bg-[#120624]/85 border border-purple-400/15 p-3.5">
            <div className="flex items-center gap-1.5 text-[11px] text-purple-300/70">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              Account Note
            </div>
            <div className="text-xs font-semibold text-purple-100 mt-1.5">
              Demo roster record only. No moderation or payout tools attached.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
