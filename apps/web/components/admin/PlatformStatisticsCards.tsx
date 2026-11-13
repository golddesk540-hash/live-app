'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Radio,
  ShieldAlert,
  Sparkles,
  UserCheck,
  Users,
  Video,
} from 'lucide-react';
import { formatStatNumber } from './mockAdminData';
import { PlatformStatistics } from './types';

interface PlatformStatisticsCardsProps {
  stats: PlatformStatistics;
  onNavigateSection?: (section: any) => void;
}

export const PlatformStatisticsCards: React.FC<PlatformStatisticsCardsProps> = ({
  stats,
  onNavigateSection,
}) => {
  const [expandedBreakdown, setExpandedBreakdown] = useState(false);

  return (
    <div data-testid="platform-statistics-cards" className="space-y-4">
      {/* 4 Hero Cards matching 10_01_admin_home_and_roles.png */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Users */}
        <div
          data-testid="stat-card-total-users"
          className="rounded-3xl bg-gradient-to-br from-[#241148] via-[#1B0D38] to-[#120728] border border-purple-500/30 p-4 sm:p-5 shadow-xl relative overflow-hidden group hover:border-pink-500/50 transition"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-bold text-purple-200/90">Total Users</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/35 flex items-center justify-center text-pink-300 shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p
              data-testid="stat-value-total-users"
              className="text-2xl sm:text-3xl font-black text-white tracking-tight tabular-nums"
            >
              {formatStatNumber(stats.totalUsers)}
            </p>
            <p className="text-[11px] font-semibold text-emerald-400 mt-1 flex items-center gap-1">
              <span>+{formatStatNumber(stats.newUsersToday)}</span>
              <span className="text-purple-300/70 font-normal">registered today</span>
            </p>
          </div>
        </div>

        {/* Live Hosts */}
        <div
          data-testid="stat-card-live-hosts"
          className="rounded-3xl bg-gradient-to-br from-[#241148] via-[#1B0D38] to-[#120728] border border-purple-500/30 p-4 sm:p-5 shadow-xl relative overflow-hidden group hover:border-pink-500/50 transition"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-bold text-purple-200/90">Live Hosts</span>
            <div className="w-10 h-10 rounded-2xl bg-pink-500/20 border border-pink-400/35 flex items-center justify-center text-pink-300 shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p
              data-testid="stat-value-live-hosts"
              className="text-2xl sm:text-3xl font-black text-white tracking-tight tabular-nums"
            >
              {formatStatNumber(stats.activeLiveHosts)}
            </p>
            <p className="text-[11px] font-semibold text-amber-300 mt-1 flex items-center gap-1">
              <span>{formatStatNumber(stats.totalHosts)}</span>
              <span className="text-purple-300/70 font-normal">total approved hosts</span>
            </p>
          </div>
        </div>

        {/* Today Live */}
        <div
          data-testid="stat-card-today-live"
          className="rounded-3xl bg-gradient-to-br from-[#241148] via-[#1B0D38] to-[#120728] border border-purple-500/30 p-4 sm:p-5 shadow-xl relative overflow-hidden group hover:border-pink-500/50 transition"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-bold text-purple-200/90">Today Live</span>
            <div className="w-10 h-10 rounded-2xl bg-pink-500/20 border border-pink-400/35 flex items-center justify-center text-pink-400 shrink-0">
              <Radio className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p
              data-testid="stat-value-today-live"
              className="text-2xl sm:text-3xl font-black text-white tracking-tight tabular-nums"
            >
              {formatStatNumber(stats.currentLiveSessions)}
            </p>
            <p className="text-[11px] font-semibold text-pink-300 mt-1 flex items-center gap-1">
              <span>{formatStatNumber(stats.totalLiveViewers)}</span>
              <span className="text-purple-300/70 font-normal">active viewers</span>
            </p>
          </div>
        </div>

        {/* Reports */}
        <div
          data-testid="stat-card-reports"
          className="rounded-3xl bg-gradient-to-br from-[#241148] via-[#1B0D38] to-[#120728] border border-purple-500/30 p-4 sm:p-5 shadow-xl relative overflow-hidden group hover:border-pink-500/50 transition"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-bold text-purple-200/90">Reports</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/35 flex items-center justify-center text-amber-300 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p
              data-testid="stat-value-reports"
              className="text-2xl sm:text-3xl font-black text-white tracking-tight tabular-nums"
            >
              {stats.totalReports}
            </p>
            <p className="text-[11px] font-semibold text-amber-300 mt-1 flex items-center gap-1">
              <span>{stats.pendingReports} pending</span>
              <span className="text-purple-300/70 font-normal">· {stats.reviewedReports} reviewed</span>
            </p>
          </div>
        </div>
      </div>

      {/* Toggle Detailed Breakdown Button */}
      <div className="flex justify-end">
        <button
          type="button"
          data-testid="toggle-detailed-stats-btn"
          onClick={() => setExpandedBreakdown((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-purple-500/30 text-xs font-bold text-purple-200 transition cursor-pointer"
        >
          <span>{expandedBreakdown ? 'Hide Detailed Statistics' : 'Show Detailed Statistics (User / Host / Live / Report)'}</span>
          {expandedBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Detailed Platform Statistics Grid */}
      {expandedBreakdown && (
        <div
          data-testid="detailed-platform-stats-grid"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 animate-in fade-in duration-200"
        >
          {/* User Statistics */}
          <div className="rounded-3xl bg-[#160A2D]/90 border border-purple-500/25 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-pink-400" />
              User Statistics
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-purple-200/80">Active Users</span>
                <span className="font-extrabold text-white">{formatStatNumber(stats.activeUsers)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-purple-200/80">New Registrations Today</span>
                <span className="font-extrabold text-emerald-400">+{formatStatNumber(stats.newUsersToday)}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-purple-200/80">Inactive Users</span>
                <span className="font-extrabold text-purple-300">{formatStatNumber(stats.inactiveUsers)}</span>
              </div>
            </div>
          </div>

          {/* Host Statistics */}
          <div className="rounded-3xl bg-[#160A2D]/90 border border-purple-500/25 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-amber-300" />
              Host Statistics
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-purple-200/80">Active Live Hosts</span>
                <span className="font-extrabold text-white">{formatStatNumber(stats.activeLiveHosts)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-purple-200/80">Pending Verification</span>
                <span className="font-extrabold text-amber-300">{formatStatNumber(stats.pendingHosts)}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-purple-200/80">Suspended Hosts</span>
                <span className="font-extrabold text-rose-400">{formatStatNumber(stats.suspendedHosts)}</span>
              </div>
            </div>
          </div>

          {/* Live Statistics */}
          <div className="rounded-3xl bg-[#160A2D]/90 border border-purple-500/25 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-pink-400" />
              Live Stream Statistics
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-purple-200/80">Live Video Sessions</span>
                <span className="font-extrabold text-white">{formatStatNumber(stats.currentLiveSessions)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-purple-200/80">Audience Viewers</span>
                <span className="font-extrabold text-pink-300">{formatStatNumber(stats.totalLiveViewers)}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-purple-200/80">Broadcasters Live</span>
                <span className="font-extrabold text-white">{formatStatNumber(stats.currentLiveSessions)}</span>
              </div>
            </div>
          </div>

          {/* Report Statistics */}
          <div className="rounded-3xl bg-[#160A2D]/90 border border-purple-500/25 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
              Incident Reports
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-purple-200/80">Pending In Queue</span>
                <span className="font-extrabold text-amber-300">{stats.pendingReports}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-purple-200/80">Reviewed & Closed</span>
                <span className="font-extrabold text-emerald-400">{stats.reviewedReports}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-purple-200/80">Total Incident Count</span>
                <span className="font-extrabold text-white">{stats.totalReports}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
