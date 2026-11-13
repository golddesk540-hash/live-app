'use client';

import React, { useMemo } from 'react';
import { HostProfileRecord } from './userHostTypes';

interface HostManagementDashboardProps {
  hosts: HostProfileRecord[];
  onNavigateToAllHosts: () => void;
  onFilterByStatus: (status: string) => void;
  onFilterByActivity: (actStatus: string) => void;
  onViewHostDetails: (host: HostProfileRecord) => void;
}

export const HostManagementDashboard: React.FC<HostManagementDashboardProps> = ({
  hosts,
  onNavigateToAllHosts,
  onFilterByStatus,
  onFilterByActivity,
  onViewHostDetails,
}) => {
  // Compute exact metrics matching underlying mock host records
  const stats = useMemo(() => {
    let active = 0;
    let pending = 0;
    let inactive = 0;
    let suspended = 0;
    let liveNow = 0;
    let inParty = 0;
    let tierS = 0;

    hosts.forEach((h) => {
      if (h.hostStatus === 'Active') active++;
      if (h.hostStatus === 'Pending') pending++;
      if (h.hostStatus === 'Inactive') inactive++;
      if (h.hostStatus === 'Suspended') suspended++;
      if (h.activityStatus === 'Live Now') liveNow++;
      if (h.activityStatus === 'In Party Room') inParty++;
      if (h.taskLevelTier === 'S') tierS++;
    });

    return {
      total: hosts.length,
      active,
      pending,
      inactive,
      suspended,
      liveNow,
      inParty,
      tierS,
    };
  }, [hosts]);

  // Recent host registrations (latest 4)
  const recentHosts = useMemo(() => {
    return [...hosts]
      .sort((a, b) => b.registrationDate.localeCompare(a.registrationDate))
      .slice(0, 5);
  }, [hosts]);

  return (
    <div className="space-y-6" id="host-management-dashboard">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_10px_#A855F7]" />
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">
              Host Management
            </h2>
          </div>
          <p className="text-xs md:text-sm text-zinc-400 mt-1">
            Broadcaster credentials, agency affiliations, task tier monitoring, and broadcast standing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onNavigateToAllHosts}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-xs shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
            </svg>
            <span>View All {stats.total} Hosts</span>
          </button>
        </div>
      </div>

      {/* 5 Key Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Hosts */}
        <div
          onClick={onNavigateToAllHosts}
          className="p-4 rounded-3xl bg-[#160A2D]/85 border border-purple-500/25 hover:border-purple-400 cursor-pointer backdrop-blur-md transition-all group"
        >
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            Total Creators
          </div>
          <div className="text-2xl font-extrabold text-white group-hover:text-purple-300 transition-colors">
            {stats.total}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">Registered hosts</div>
        </div>

        {/* Active Hosts */}
        <div
          onClick={() => onFilterByStatus('Active')}
          className="p-4 rounded-3xl bg-[#160A2D]/85 border border-emerald-500/25 hover:border-emerald-500/50 cursor-pointer backdrop-blur-md transition-all group"
        >
          <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
            Active Standing
          </div>
          <div className="text-2xl font-extrabold text-emerald-300">
            {stats.active}
          </div>
          <div className="text-[10px] text-emerald-400/70 mt-1">
            {Math.round((stats.active / stats.total) * 100)}% approved
          </div>
        </div>

        {/* Live Now (Activity) */}
        <div
          onClick={() => onFilterByActivity('Live Now')}
          className="p-4 rounded-3xl bg-[#160A2D]/85 border border-pink-500/30 hover:border-pink-500/60 cursor-pointer backdrop-blur-md transition-all group shadow-[0_0_15px_rgba(255,15,123,0.15)]"
        >
          <div className="text-[10px] font-bold text-pink-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping" />
            <span>Broadcasting Now</span>
          </div>
          <div className="text-2xl font-extrabold text-pink-300">
            {stats.liveNow}
          </div>
          <div className="text-[10px] text-pink-400/80 mt-1">Agora video rooms</div>
        </div>

        {/* Pending Approval */}
        <div
          onClick={() => onFilterByStatus('Pending')}
          className="p-4 rounded-3xl bg-[#160A2D]/85 border border-amber-500/25 hover:border-amber-500/50 cursor-pointer backdrop-blur-md transition-all group"
        >
          <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
            Pending Review
          </div>
          <div className="text-2xl font-extrabold text-amber-300">
            {stats.pending}
          </div>
          <div className="text-[10px] text-amber-400/70 mt-1">Host audition queue</div>
        </div>

        {/* Suspended Standing */}
        <div
          onClick={() => onFilterByStatus('Suspended')}
          className="p-4 rounded-3xl bg-[#160A2D]/85 border border-rose-500/25 hover:border-rose-500/50 cursor-pointer backdrop-blur-md transition-all group"
        >
          <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1">
            Suspended Hosts
          </div>
          <div className="text-2xl font-extrabold text-rose-300">
            {stats.suspended}
          </div>
          <div className="text-[10px] text-rose-400/70 mt-1">Policy holds</div>
        </div>
      </div>

      {/* Two Columns: Recent Host Registrations & Broadcast Vitals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Recent Host Registrations */}
        <div className="lg:col-span-7 p-5 rounded-3xl bg-[#160A2D]/80 border border-purple-500/20 backdrop-blur-md shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span>Recent Host Onboardings</span>
            </h3>
            <button
              onClick={onNavigateToAllHosts}
              className="text-xs text-pink-400 hover:text-pink-300 font-semibold"
            >
              View All ↗
            </button>
          </div>

          <div className="space-y-3">
            {recentHosts.map((host) => (
              <div
                key={host.id}
                className="p-3.5 rounded-2xl bg-[#0E061E]/80 border border-purple-500/15 flex items-center justify-between gap-3 hover:border-pink-500/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={host.avatar}
                      alt={host.username}
                      className="w-10 h-10 rounded-2xl object-cover border border-purple-500/30"
                    />
                    {host.activityStatus === 'Live Now' && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse border border-[#160A2D]" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{host.username}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                        {host.id}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                        {host.hostLevel}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      Agency: <strong className="text-zinc-300">{host.agencyName}</strong> •{' '}
                      {host.country}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${
                      host.activityStatus === 'Live Now'
                        ? 'bg-pink-500/20 text-pink-300 border-pink-500/40'
                        : host.activityStatus === 'In Party Room'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    {host.activityStatus}
                  </span>
                  <button
                    onClick={() => onViewHostDetails(host)}
                    className="px-2.5 py-1 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-semibold border border-purple-500/25 transition-colors"
                  >
                    Inspect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 5 cols: Creator Task Tiers & Quick Actions */}
        <div className="lg:col-span-5 p-5 rounded-3xl bg-[#160A2D]/80 border border-purple-500/20 backdrop-blur-md shadow-xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pink-400" />
              <span>Host Tier Distribution</span>
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Task level tier distribution across verified creators
            </p>
          </div>

          <div className="space-y-2.5 pt-1">
            <div className="p-3 rounded-2xl bg-[#0E061E]/80 border border-purple-500/15 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-lg bg-pink-500/20 text-pink-300 font-bold text-xs border border-pink-500/30 font-mono">
                  Tier S
                </span>
                <span className="text-xs text-white">Top Broadcaster Tier</span>
              </div>
              <span className="font-mono text-xs font-bold text-pink-400">
                {stats.tierS} Creators
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#0E061E]/80 border border-purple-500/15 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 font-bold text-xs border border-purple-500/30 font-mono">
                  Tier A
                </span>
                <span className="text-xs text-white">Advanced Broadcasters</span>
              </div>
              <span className="font-mono text-xs font-bold text-purple-300">
                {hosts.filter((h) => h.taskLevelTier === 'A').length} Creators
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#0E061E]/80 border border-purple-500/15 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-lg bg-teal-500/20 text-teal-300 font-bold text-xs border border-teal-500/30 font-mono">
                  Tier B & C
                </span>
                <span className="text-xs text-white">Standard & Onboarding Tiers</span>
              </div>
              <span className="font-mono text-xs font-bold text-teal-300">
                {hosts.filter((h) => h.taskLevelTier === 'B' || h.taskLevelTier === 'C').length}{' '}
                Creators
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-purple-500/15">
            <div className="text-[11px] font-semibold text-zinc-400 mb-2">Host Operations Quick Links:</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onFilterByActivity('Live Now')}
                className="p-2.5 rounded-xl bg-[#0E061E] hover:bg-purple-950/40 text-left border border-purple-500/20 text-xs text-zinc-300 transition-colors"
              >
                <div className="font-bold text-white text-[11px]">Live Agora Rooms</div>
                <div className="text-[10px] text-zinc-500">Filter active video streams</div>
              </button>
              <button
                onClick={() => onFilterByStatus('Pending')}
                className="p-2.5 rounded-xl bg-[#0E061E] hover:bg-purple-950/40 text-left border border-purple-500/20 text-xs text-zinc-300 transition-colors"
              >
                <div className="font-bold text-white text-[11px]">Pending Approvals</div>
                <div className="text-[10px] text-zinc-500">Review creator auditions</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
