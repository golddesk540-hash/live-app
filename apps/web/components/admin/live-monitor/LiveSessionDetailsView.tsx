'use client';

import React, { useState } from 'react';
import { LiveSessionRecord, LiveSessionStatus } from './liveMonitorTypes';

interface LiveSessionDetailsViewProps {
  session: LiveSessionRecord;
  onBack: () => void;
  onOpenPreview: (session: LiveSessionRecord) => void;
  onUpdateDemoStatus?: (sessionId: string, nextStatus: LiveSessionStatus) => void;
  onViewHostProfile?: (hostId: string) => void;
}

export const LiveSessionDetailsView: React.FC<LiveSessionDetailsViewProps> = ({
  session,
  onBack,
  onOpenPreview,
  onUpdateDemoStatus,
  onViewHostProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'host' | 'viewers' | 'activity'>('overview');
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  const handleStatusClick = (next: LiveSessionStatus) => {
    onUpdateDemoStatus?.(session.id, next);
    setDemoNotice(`Demo status set to "${next}".`);
    setTimeout(() => setDemoNotice(null), 3000);
  };

  return (
    <div className="space-y-6" id="live-session-details-view">
      {/* Top Navigation Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#0E061E] hover:bg-purple-950/40 text-purple-300 border border-purple-500/25 text-xs font-semibold transition-all active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Live Sessions</span>
        </button>

        <div className="flex items-center gap-2">
          {demoNotice && (
            <span className="text-xs text-pink-400 font-bold animate-fadeIn">
              {demoNotice}
            </span>
          )}
          <button
            onClick={() => onOpenPreview(session)}
            data-testid="inspect-preview-btn"
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-xs shadow-[0_0_15px_rgba(255,15,123,0.35)] transition-all flex items-center gap-2 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Launch Stream Preview</span>
          </button>
        </div>
      </div>

      {/* Hero Session Banner Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#160A2D] via-[#210D40] to-[#0E061E] border border-purple-500/35 shadow-2xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start md:items-center gap-5">
          <div className="relative shrink-0">
            <img
              src={session.hostAvatar}
              alt={session.hostUsername}
              className="w-20 h-20 rounded-3xl object-cover border-2 border-pink-500/50 shadow-[0_0_20px_rgba(255,15,123,0.35)]"
            />
            <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-md bg-red-600 text-white font-black text-[9px] tracking-wider uppercase shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse">
              LIVE
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl md:text-2xl font-black text-white tracking-wide">
                Room #{session.roomNumber}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-500/20 text-pink-300 border border-pink-500/40">
                {session.category}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-200 border border-purple-500/30">
                {session.sessionType}
              </span>
            </div>

            <p className="text-sm font-semibold text-zinc-200 line-clamp-1 mb-1.5">
              {session.sessionTitle}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
              <span>Host: <strong className="text-white">{session.hostUsername}</strong> ({session.hostId})</span>
              <span>·</span>
              <span>Started: <strong className="text-zinc-300">{session.startTime}</strong></span>
              <span>·</span>
              <span>Duration: <strong className="text-purple-300 font-mono">{session.duration}</strong></span>
            </div>
          </div>
        </div>

        {/* Quick Audience Counter */}
        <div className="flex items-center gap-4 bg-[#0E061E]/80 border border-purple-500/25 p-4 rounded-2xl shrink-0">
          <div>
            <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
              Current Viewers
            </div>
            <div className="text-2xl font-black text-pink-400 flex items-center gap-2">
              <span>{session.currentViewers.toLocaleString()}</span>
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
            </div>
          </div>
          <div className="border-l border-purple-500/20 pl-4">
            <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
              Peak Viewers
            </div>
            <div className="text-xl font-extrabold text-emerald-400">
              {session.peakViewers.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Information Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-purple-500/20 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Stream Overview & Telemetry' },
          { id: 'host', label: 'Host Information' },
          { id: 'viewers', label: `Audience (${session.activeViewers.length} sample)` },
          { id: 'activity', label: `Live Activity (${session.sessionActivities.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            data-testid={`tab-${tab.id}`}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-[0_0_15px_rgba(255,15,123,0.35)]'
                : 'text-zinc-400 hover:text-white bg-[#0E061E] border border-purple-500/20'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview & Telemetry */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Key Metrics 4-Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#160A2D] border border-purple-500/25">
              <div className="text-[10px] uppercase font-bold text-zinc-400">Session ID</div>
              <div className="text-sm font-mono font-bold text-white mt-1">{session.id}</div>
              <div className="text-[10px] text-zinc-500 mt-1">Room #{session.roomNumber}</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#160A2D] border border-purple-500/25">
              <div className="text-[10px] uppercase font-bold text-zinc-400">Gifts Received</div>
              <div className="text-base font-bold text-amber-400 mt-1">
                {session.totalGiftsReceivedCoins.toLocaleString()} coins
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">Virtual gifts in this session</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#160A2D] border border-purple-500/25">
              <div className="text-[10px] uppercase font-bold text-zinc-400">Resolution & Bitrate</div>
              <div className="text-sm font-mono font-bold text-white mt-1">1080p @ 60fps</div>
              <div className="text-[10px] text-emerald-400 mt-1">Bitrate: 4,500 kbps (Stable)</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#160A2D] border border-purple-500/25">
              <div className="text-[10px] uppercase font-bold text-zinc-400">Current Status</div>
              <div className="text-sm font-bold text-white mt-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span>{session.status}</span>
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">Local frontend state</div>
            </div>
          </div>

          {/* Description & Demo Status Overrides */}
          <div className="p-5 rounded-3xl bg-[#160A2D]/85 border border-purple-500/25 space-y-4">
            <h3 className="text-sm font-bold text-white">Broadcast Description & Rules</h3>
            <p className="text-xs text-zinc-300 leading-relaxed bg-[#0E061E] p-4 rounded-2xl border border-purple-500/20">
              {session.sessionDescription}
            </p>

            <div className="pt-2 border-t border-purple-500/20">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                Simulate Demo Session Status
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {(['Live', 'Ending', 'Interrupted', 'Ended'] as LiveSessionStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusClick(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                      session.status === st
                        ? 'bg-pink-500/25 text-pink-300 border-pink-500'
                        : 'bg-[#0E061E] text-zinc-300 border-purple-500/25 hover:text-white'
                    }`}
                  >
                    Set to {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Host Information Panel (Section 7) */}
      {activeTab === 'host' && (
        <div className="p-6 rounded-3xl bg-[#160A2D]/85 border border-purple-500/25 space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-500/20">
            <div className="flex items-center gap-4">
              <img
                src={session.hostAvatar}
                alt={session.hostUsername}
                className="w-16 h-16 rounded-2xl object-cover border border-pink-500/50"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{session.hostUsername}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/40">
                    {session.hostTier}
                  </span>
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  Host ID: <strong className="text-zinc-200">{session.hostId}</strong> · Nickname: {session.hostNickname}
                </div>
                <div className="text-xs text-purple-300 mt-0.5">
                  Agency: {session.agencyName || 'Independent Creator'} ({session.country})
                </div>
              </div>
            </div>

            {onViewHostProfile && (
              <button
                onClick={() => onViewHostProfile(session.hostId)}
                className="px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/40 text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto"
              >
                <span>View Full Host Record</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#0E061E] border border-purple-500/20">
              <div className="text-[10px] text-zinc-400 uppercase font-bold">Account Standing</div>
              <div className="text-sm font-bold text-emerald-400 mt-1">{session.hostAccountStatus}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#0E061E] border border-purple-500/20">
              <div className="text-[10px] text-zinc-400 uppercase font-bold">Verification Status</div>
              <div className="text-sm font-bold text-pink-300 mt-1">{session.hostVerificationStatus}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#0E061E] border border-purple-500/20">
              <div className="text-[10px] text-zinc-400 uppercase font-bold">Host Level</div>
              <div className="text-sm font-bold text-white mt-1">{session.hostLevel}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#0E061E] border border-purple-500/20">
              <div className="text-[10px] text-zinc-400 uppercase font-bold">Country / Territory</div>
              <div className="text-sm font-bold text-white mt-1">{session.country} ({session.countryCode})</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Viewer Information & Audience (Section 8) */}
      {activeTab === 'viewers' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-4 rounded-3xl bg-[#160A2D]/85 border border-purple-500/25 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Live Audience Roster</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Active VIPs, moderators, and registered audience members connected to Room #{session.roomNumber}.
              </p>
            </div>
            <span className="text-xs font-bold text-pink-400 bg-pink-500/10 px-3 py-1.5 rounded-xl border border-pink-500/30">
              Total Audience: {session.currentViewers.toLocaleString()}
            </span>
          </div>

          <div className="rounded-3xl bg-[#160A2D]/85 border border-purple-500/25 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-purple-500/20 bg-[#0E061E]/80 text-[10px] font-bold text-zinc-400 uppercase">
                  <th className="py-3 px-4">Viewer</th>
                  <th className="py-3 px-4">User ID</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Wealth Level</th>
                  <th className="py-3 px-4">Coins Gifted</th>
                  <th className="py-3 px-4 text-right">Join Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/15">
                {session.activeViewers.map((viewer) => (
                  <tr key={viewer.id} className="hover:bg-purple-950/20 transition-colors">
                    <td className="py-3 px-4 flex items-center gap-2.5">
                      <img
                        src={viewer.avatar}
                        alt={viewer.username}
                        className="w-8 h-8 rounded-full object-cover border border-purple-500/30"
                      />
                      <div>
                        <div className="font-bold text-white">{viewer.username}</div>
                        <div className="text-[10px] text-zinc-400">{viewer.nickname}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-300">{viewer.id}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        viewer.viewerStatus === 'VIP'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : viewer.viewerStatus === 'Moderator'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : viewer.viewerStatus === 'Admin Guest'
                          ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {viewer.viewerStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-amber-400">Lv.{viewer.wealthLevel}</td>
                    <td className="py-3 px-4 text-zinc-200">{viewer.coinsSpent.toLocaleString()} coins</td>
                    <td className="py-3 px-4 text-right text-zinc-400">{viewer.joinTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Live Activity Timeline (Section 11) */}
      {activeTab === 'activity' && (
        <div className="p-6 rounded-3xl bg-[#160A2D]/85 border border-purple-500/25 space-y-4 animate-fadeIn">
          <h3 className="text-sm font-bold text-white mb-2">Room #{session.roomNumber} Broadcast Timeline</h3>
          <div className="space-y-3">
            {session.sessionActivities.length === 0 ? (
              <p className="text-xs text-zinc-400 py-6 text-center">
                No recent activity events recorded for this session.
              </p>
            ) : (
              session.sessionActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-2xl bg-[#0E061E] border border-purple-500/20 flex items-start gap-3"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                    style={{ backgroundColor: act.highlightColor || '#FF0F7B' }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{act.title}</span>
                      <span className="text-[10px] text-zinc-500">{act.timestamp}</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{act.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
