'use client';

import React from 'react';
import {
  LiveActivityEvent,
  LiveMonitorMetrics,
  LiveSessionCategory,
  LiveSessionRecord,
} from './liveMonitorTypes';

interface LiveMonitorDashboardProps {
  metrics: LiveMonitorMetrics;
  sessions: LiveSessionRecord[];
  recentActivities: LiveActivityEvent[];
  selectedCategory: LiveSessionCategory;
  onSelectCategory: (cat: LiveSessionCategory) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNavigateToActiveSessions: () => void;
  onNavigateToHistory: () => void;
  onPreviewSession: (session: LiveSessionRecord) => void;
  onViewSessionDetails: (session: LiveSessionRecord) => void;
}

export const LiveMonitorDashboard: React.FC<LiveMonitorDashboardProps> = ({
  metrics,
  sessions,
  recentActivities,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onNavigateToActiveSessions,
  onNavigateToHistory,
  onPreviewSession,
  onViewSessionDetails,
}) => {
  // Top 4 featured streams matching 10_03_live_monitor.png
  const topFeatured = sessions.slice(0, 4);

  const categories: LiveSessionCategory[] = [
    'All',
    'Entertainment',
    'Music',
    'Chat',
    'Gaming',
    'Party Room',
    'Talent',
  ];

  return (
    <div className="space-y-6" id="live-monitor-dashboard">
      {/* 10_03 Title & Sub-header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500 shadow-[0_0_10px_#FF0F7B]" />
            </span>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-wide">
              Live Monitor
            </h1>
          </div>
          <p className="text-xs md:text-sm text-zinc-400 mt-1">
            Real-time Agora RTC session monitoring, audience engagement, and broadcast telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onNavigateToHistory}
            className="px-4 py-2 rounded-2xl bg-[#0E061E] hover:bg-purple-950/40 text-purple-300 border border-purple-500/25 text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Session History</span>
          </button>
          <button
            onClick={onNavigateToActiveSessions}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-xs shadow-[0_0_20px_rgba(255,15,123,0.35)] transition-all flex items-center gap-1.5 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>All Active Sessions ({metrics.totalActiveSessions})</span>
          </button>
        </div>
      </div>

      {/* 10_03 Reference Two Primary Metric Cards (Live Now & Viewers) + Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Live Now - Exact Match to 10_03 picture */}
        <div
          onClick={onNavigateToActiveSessions}
          className="p-5 rounded-3xl bg-gradient-to-br from-[#1B0A33] via-[#160A2D] to-[#0E061E] border border-pink-500/40 shadow-[0_0_30px_rgba(255,15,123,0.2)] hover:border-pink-500/70 transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-purple-200 tracking-wider">
              Live Now
            </div>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(255,15,123,0.6)] group-hover:scale-110 transition-transform">
              {/* Glowing pink flame / video icon matching 10_03 */}
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.527.82-1.173 2.243-1.173 3.952 0 .584-.028 1.15-.098 1.696-.05.385-.294.71-.65.845-.357.136-.76.046-1.03-.228-.42-.424-.71-1.002-.857-1.616a1 1 0 00-1.785-.453C3.59 8.653 3 10.51 3 12.5 3 16.642 6.358 20 10.5 20s7.5-3.358 7.5-7.5c0-3.535-2.45-6.68-5.605-9.947zM10.5 18a5.5 5.5 0 01-5.5-5.5c0-1.042.28-2.02.772-2.868.497.697 1.18 1.25 1.986 1.558.74.283 1.57.218 2.254-.183.685-.4 1.144-1.08 1.258-1.859.043-.298.064-.6.064-.906 0-.895.2-1.777.56-2.6.994 1.196 2.106 2.766 2.106 4.358A5.5 5.5 0 0110.5 18z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="text-3xl lg:text-4xl font-black text-white mt-3 tracking-tight flex items-baseline gap-2">
            <span>{metrics.totalActiveSessions.toLocaleString()}</span>
            <span className="text-xs font-semibold text-emerald-400">● Real-time</span>
          </div>
          <div className="text-[11px] text-zinc-400 mt-2 flex items-center justify-between">
            <span>Active video streams</span>
            <span className="text-pink-400 group-hover:translate-x-1 transition-transform">Browse all →</span>
          </div>
        </div>

        {/* Card 2: Viewers - Exact Match to 10_03 picture */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#160A2D] via-[#1F0D3D] to-[#0E061E] border border-purple-500/35 shadow-xl hover:border-purple-500/60 transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-purple-200 tracking-wider">
              Viewers
            </div>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] group-hover:scale-110 transition-transform">
              {/* Purple audience icon matching 10_03 */}
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 16v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl lg:text-4xl font-black text-white mt-3 tracking-tight">
            {metrics.totalViewers.toLocaleString()}
          </div>
          <div className="text-[11px] text-zinc-400 mt-2 flex items-center justify-between">
            <span>Peak Today: {metrics.peakConcurrentViewersToday.toLocaleString()}</span>
            <span className="text-purple-300 font-medium">Global</span>
          </div>
        </div>

        {/* Card 3: Party Rooms */}
        <div className="p-5 rounded-3xl bg-[#160A2D]/85 border border-purple-500/25 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-zinc-300 tracking-wider">Party Rooms</div>
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-white mt-3">
            {metrics.activePartyRooms.toLocaleString()}
          </div>
          <div className="text-[11px] text-zinc-400 mt-2">Multi-seat voice & video rooms</div>
        </div>

        {/* Card 4: Private & VIP Sessions */}
        <div className="p-5 rounded-3xl bg-[#160A2D]/85 border border-purple-500/25 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-zinc-300 tracking-wider">Private Streams</div>
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-amber-300 mt-3">
            {metrics.privateSessionsCount.toLocaleString()}
          </div>
          <div className="text-[11px] text-zinc-400 mt-2">Agency masterclasses & closed rooms</div>
        </div>
      </div>

      {/* 10_03 Controls Bar: Category Pills + Search Host Input */}
      <div className="p-4 rounded-3xl bg-[#160A2D]/85 border border-purple-500/25 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Pills matching 10_03 "All Live" dropdown / buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  active
                    ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-[0_0_12px_rgba(255,15,123,0.4)]'
                    : 'text-zinc-400 hover:text-white bg-[#0E061E] border border-purple-500/20 hover:border-purple-500/40'
                }`}
              >
                {cat === 'All' ? 'All Live' : cat}
              </button>
            );
          })}
        </div>

        {/* Search Host Input matching 10_03 picture */}
        <div className="relative min-w-[220px] sm:min-w-[280px]">
          <svg
            className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search host..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-[#0E061E] border border-purple-500/30 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Main Content Layout: Featured 10_03 Sessions List (Left 7 cols) & Live Activity Feed (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Featured Live Sessions matching 10_03 UI exactly */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_8px_#FF0F7B]" />
              <span>Active Broadcasts</span>
            </h2>
            <button
              onClick={onNavigateToActiveSessions}
              className="text-xs text-pink-400 hover:text-pink-300 font-semibold transition"
            >
              View Full Directory ({sessions.length}) →
            </button>
          </div>

          {/* List of Sessions exactly matching cards from 10_03_live_monitor.png */}
          <div className="space-y-3">
            {topFeatured.map((item) => {
              const formattedViewers =
                item.currentViewers >= 1000
                  ? `${(item.currentViewers / 1000).toFixed(1)}K`
                  : item.currentViewers.toString();

              return (
                <div
                  key={item.id}
                  data-testid={`session-card-${item.hostUsername}`}
                  className="p-3.5 sm:p-4 rounded-3xl bg-[#160A2D]/85 border border-purple-500/25 hover:border-pink-500/50 shadow-lg backdrop-blur-md transition-all flex items-center justify-between gap-3 group"
                >
                  {/* Left: Avatar with red LIVE badge in top right corner */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={item.hostAvatar}
                        alt={item.hostUsername}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                      />
                      {/* Red LIVE badge matching 10_03 */}
                      <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-md bg-red-600 text-[8px] font-black text-white tracking-wider uppercase shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse">
                        LIVE
                      </span>
                    </div>

                    {/* Host details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white group-hover:text-pink-300 transition truncate">
                          {item.hostUsername}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 truncate mt-0.5 max-w-[200px] sm:max-w-xs">
                        {item.sessionTitle}
                      </p>
                      <div className="text-[10px] text-zinc-500 mt-1 flex items-center gap-2">
                        <span>Room #{item.roomNumber}</span>
                        <span>·</span>
                        <span>{item.duration}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Viewer count & Quick Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Viewer icon + count matching 10_03 (e.g. 12.4K) */}
                    <div className="flex items-center gap-1.5 text-zinc-300 font-bold text-xs bg-[#0E061E] px-3 py-1.5 rounded-xl border border-purple-500/25">
                      <svg className="w-3.5 h-3.5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>{formattedViewers}</span>
                    </div>

                    {/* Preview Button */}
                    <button
                      onClick={() => onPreviewSession(item)}
                      className="p-2 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/35 transition"
                      title="Quick Live Preview"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>

                    {/* View Details / Options button matching 10_03 vertical dots / slider icon */}
                    <button
                      onClick={() => onViewSessionDetails(item)}
                      className="p-2 rounded-xl bg-[#0E061E] hover:bg-purple-900/40 text-purple-300 border border-purple-500/25 transition"
                      title="View Session Details"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 cols: Live Activity Timeline */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_#A855F7]" />
              <span>Real-Time Activity Stream</span>
            </h2>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
              Live Feed
            </span>
          </div>

          <div className="p-4 rounded-3xl bg-[#160A2D]/85 border border-purple-500/25 shadow-lg backdrop-blur-md space-y-3.5">
            {recentActivities.map((act) => (
              <div
                key={act.id}
                className="p-3 rounded-2xl bg-[#0E061E]/80 border border-purple-500/20 hover:border-purple-500/40 transition flex items-start gap-3"
              >
                <div
                  className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                  style={{ backgroundColor: act.highlightColor || '#FF0F7B' }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white truncate">
                      {act.title}
                    </span>
                    <span className="text-[10px] text-zinc-500 shrink-0">
                      {act.timestamp}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                    {act.description}
                  </p>
                  <div className="text-[10px] text-pink-400/80 mt-1">
                    Room {act.sessionId.replace('LIV-', '#')} · {act.hostUsername}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
