'use client';

import React, { useState } from 'react';
import { HostProfileRecord } from './userHostTypes';

interface HostDetailsViewProps {
  host: HostProfileRecord;
  onBack: () => void;
  onChangeHostStatusClick: (host: HostProfileRecord) => void;
  onViewLinkedUser?: (userId: string) => void;
}

export const HostDetailsView: React.FC<HostDetailsViewProps> = ({
  host,
  onBack,
  onChangeHostStatusClick,
  onViewLinkedUser,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'activity' | 'tasks' | 'history'>('overview');

  return (
    <div className="space-y-6" id="host-details-view">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#0E061E] hover:bg-purple-950/40 text-purple-300 border border-purple-500/25 text-xs font-semibold transition-all active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to All Hosts</span>
        </button>

        <div className="flex items-center gap-2">
          {onViewLinkedUser && (
            <button
              onClick={() => onViewLinkedUser(host.linkedUserId)}
              className="px-4 py-2 rounded-2xl bg-[#0E061E] hover:bg-purple-900/40 text-purple-300 border border-purple-500/25 text-xs font-semibold transition-all"
            >
              View Linked User ({host.linkedUserId})
            </button>
          )}
          <button
            data-testid="manage-host-standing-btn"
            onClick={() => onChangeHostStatusClick(host)}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold text-xs shadow-[0_0_15px_rgba(255,15,123,0.3)] transition-all"
          >
            Manage Host Standing ({host.hostStatus})
          </button>
        </div>
      </div>

      {/* Hero Host Banner Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#160A2D] via-[#210D40] to-[#0E061E] border border-purple-500/35 shadow-2xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start md:items-center gap-5">
          <div className="relative">
            <img
              src={host.avatar}
              alt={host.username}
              className="w-20 h-20 rounded-3xl object-cover border-2 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
            />
            {host.activityStatus === 'Live Now' && (
              <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-lg bg-pink-500 text-white font-mono font-bold text-[9px] shadow-md animate-pulse">
                LIVE
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-white">{host.username}</h2>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-pink-500/20 text-pink-300 border border-pink-500/30">
                {host.id}
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                {host.hostLevel}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-xl text-xs font-bold border ${
                  host.hostStatus === 'Active'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : host.hostStatus === 'Suspended'
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}
              >
                {host.hostStatus}
              </span>
            </div>

            <div className="text-xs text-zinc-400 mt-1 flex items-center gap-3 flex-wrap">
              <span>Nickname: <strong className="text-zinc-200">{host.nickname}</strong></span>
              <span>•</span>
              <span>Agency: <strong className="text-zinc-200">{host.agencyName}</strong></span>
              <span>•</span>
              <span>{host.country}</span>
              <span>•</span>
              <span>Registered {host.registrationDate}</span>
            </div>

            <div className="text-xs text-zinc-300 mt-2 flex items-center gap-2">
              <span className="text-zinc-500">Linked User:</span>
              <span className="font-mono text-purple-300 font-bold">{host.linkedUserId}</span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-500">Category:</span>
              <span className="text-white font-medium">{host.streamCategory}</span>
            </div>
          </div>
        </div>

        {/* Streaming Summary Vitals */}
        <div className="flex md:flex-col items-center md:items-end justify-between gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-purple-500/20">
          <div className="text-left md:text-right">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
              Total Broadcaster Fans
            </div>
            <div className="text-sm font-bold text-pink-400 font-mono">
              {host.followersCount.toLocaleString()} followers
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
              Live Streaming Hours
            </div>
            <div className="text-sm font-bold text-purple-300 font-mono">
              {host.totalLiveHours} hrs
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 border-b border-purple-500/20 pb-2 overflow-x-auto">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'profile', label: 'Host Profile' },
          { key: 'activity', label: `Activity (${host.activityHistory.length})` },
          { key: 'tasks', label: `Daily Tasks (${host.dailyTasksCompleted}/${host.dailyTasksTotal})` },
          { key: 'history', label: `Standing History (${host.hostAuditLog.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === t.key
                ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.35)]'
                : 'text-zinc-400 hover:text-white hover:bg-purple-950/40'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-5 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-3xl bg-[#160A2D]/80 border border-purple-500/20">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">
                Broadcast Standing
              </span>
              <span className="text-lg font-bold text-white">{host.activityStatus}</span>
              <div className="text-[11px] text-zinc-400 mt-1">Real-time status</div>
            </div>

            <div className="p-4 rounded-3xl bg-[#160A2D]/80 border border-purple-500/20">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">
                Task Level Tier
              </span>
              <span className="text-lg font-bold text-pink-400 font-mono">
                Tier {host.taskLevelTier} ({host.hostLevel})
              </span>
              <div className="text-[11px] text-zinc-400 mt-1">Creator incentive bracket</div>
            </div>

            <div className="p-4 rounded-3xl bg-[#160A2D]/80 border border-purple-500/20">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">
                Total Live Hours
              </span>
              <span className="text-lg font-bold text-purple-300 font-mono">
                {host.totalLiveHours} hrs
              </span>
              <div className="text-[11px] text-zinc-400 mt-1">Cumulative airtime</div>
            </div>

            <div className="p-4 rounded-3xl bg-[#160A2D]/80 border border-purple-500/20">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">
                Host Earned Points
              </span>
              <span className="text-lg font-bold text-amber-300 font-mono">
                {host.earnedPoints.toLocaleString()} pts
              </span>
              <div className="text-[11px] text-zinc-400 mt-1">Live gifts & task rewards</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Host Profile */}
      {activeTab === 'profile' && (
        <div className="p-6 rounded-3xl bg-[#160A2D]/80 border border-purple-500/20 backdrop-blur-md space-y-4 animate-fadeIn text-xs">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span>Host Contract & Agency Affiliation</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-2xl bg-[#0E061E]/80 border border-purple-500/15">
              <span className="text-zinc-500 block mb-1">Affiliated Agency</span>
              <span className="font-semibold text-white">{host.agencyName}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0E061E]/80 border border-purple-500/15">
              <span className="text-zinc-500 block mb-1">Stream Category</span>
              <span className="font-semibold text-white">{host.streamCategory}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0E061E]/80 border border-purple-500/15">
              <span className="text-zinc-500 block mb-1">Linked Popo Live User ID</span>
              <span className="font-mono font-semibold text-pink-300">{host.linkedUserId}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0E061E]/80 border border-purple-500/15">
              <span className="text-zinc-500 block mb-1">Country of Broadcast</span>
              <span className="font-semibold text-white">
                {host.country} ({host.countryCode})
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0E061E]/80 border border-purple-500/15">
              <span className="text-zinc-500 block mb-1">Host Registration Date</span>
              <span className="font-semibold text-white">{host.registrationDate}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0E061E]/80 border border-purple-500/15">
              <span className="text-zinc-500 block mb-1">Identity & Earning Verification</span>
              <span className="font-semibold text-emerald-400">Verified & Approved</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Activity */}
      {activeTab === 'activity' && (
        <div className="p-6 rounded-3xl bg-[#160A2D]/80 border border-purple-500/20 backdrop-blur-md space-y-4 animate-fadeIn">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-400" />
            <span>Broadcast & Host Activity Log</span>
          </h3>

          <div className="space-y-3">
            {host.activityHistory.map((act) => (
              <div
                key={act.id}
                className="p-4 rounded-2xl bg-[#0E061E]/80 border border-purple-500/15 flex items-start justify-between gap-4"
              >
                <div>
                  <div className="font-bold text-white text-xs">{act.action}</div>
                  <div className="text-xs text-zinc-400 mt-0.5">{act.details}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-[10px] text-zinc-500 font-mono">{act.timestamp}</span>
                  <span className="block mt-1 text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                    {act.category}
                  </span>
                </div>
              </div>
            ))}
            {host.activityHistory.length === 0 && (
              <div className="text-xs text-zinc-500 py-6 text-center italic">
                No recent live broadcasts or host events recorded.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Tasks (Daily Tasks & Task Level Tiers) */}
      {activeTab === 'tasks' && (
        <div className="p-6 rounded-3xl bg-[#160A2D]/80 border border-purple-500/20 backdrop-blur-md space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400" />
              <span>Daily Host Tasks Progress (Phase 9.2 / 9.3 integration)</span>
            </h3>
            <span className="text-xs font-mono font-bold text-pink-400">
              {host.dailyTasksCompleted} of {host.dailyTasksTotal} Completed
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0E061E]/80 border border-purple-500/20 space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-300">
              <span>Today's Task Completion Rate</span>
              <span className="font-bold text-white">
                {Math.round((host.dailyTasksCompleted / host.dailyTasksTotal) * 100)}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-500"
                style={{
                  width: `${(host.dailyTasksCompleted / host.dailyTasksTotal) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#0E061E]/80 border border-purple-500/15 flex items-center justify-between">
              <div>
                <div className="font-bold text-white">Task 1: Live 60 Minutes</div>
                <div className="text-[11px] text-zinc-400">Airtime target for daily tier credit</div>
              </div>
              <span className="text-emerald-400 font-bold text-[11px]">✓ Done</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0E061E]/80 border border-purple-500/15 flex items-center justify-between">
              <div>
                <div className="font-bold text-white">Task 2: Receive 5,000 Points</div>
                <div className="text-[11px] text-zinc-400">Viewer gift threshold</div>
              </div>
              <span className={host.dailyTasksCompleted >= 2 ? 'text-emerald-400 font-bold text-[11px]' : 'text-zinc-500 font-bold text-[11px]'}>
                {host.dailyTasksCompleted >= 2 ? '✓ Done' : 'In Progress'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: History */}
      {activeTab === 'history' && (
        <div className="p-6 rounded-3xl bg-[#160A2D]/80 border border-purple-500/20 backdrop-blur-md space-y-4 animate-fadeIn">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>Host Standing & Accreditation Audit Log</span>
          </h3>

          <div className="space-y-3">
            {host.hostAuditLog.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-2xl bg-[#0E061E]/80 border border-purple-500/15 space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 line-through">
                      {log.previousStatus}
                    </span>
                    <span>→</span>
                    <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 font-bold border border-pink-500/30">
                      {log.newStatus}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">{log.timestamp}</span>
                </div>
                <div className="text-xs text-zinc-300 pt-1">
                  Reason: <em>"{log.reason}"</em>
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">By: {log.changedBy}</div>
              </div>
            ))}
            {host.hostAuditLog.length === 0 && (
              <div className="text-xs text-zinc-500 py-6 text-center italic">
                No status adjustments recorded for this host.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
