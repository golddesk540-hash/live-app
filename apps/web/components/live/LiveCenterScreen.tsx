'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface PastSession {
  id: string;
  roomNumber: string;
  title: string;
  category: string;
  coverUrl: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  durationFormatted: string;
  totalViewers: number;
  totalViewersFormatted: string;
  peakViewers: number;
  peakViewersFormatted: string;
  newFollowers: number;
  pointsReceived: number;
  status: string;
}

interface HostProfile {
  id: string;
  nickname: string;
  poppoId: string;
  avatarUrl: string;
  level: number;
}

interface KPIs {
  totalSessions: number;
  totalDurationSeconds: number;
  totalDurationFormatted: string;
  totalViewers: number;
  totalViewersFormatted: string;
  totalFollowers: number;
  totalFollowersFormatted: string;
}

export default function LiveCenterScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId') || '880219';

  const [activeFilter, setActiveFilter] = useState<'all' | 'week' | 'month'>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [host, setHost] = useState<HostProfile>({
    id: 'demo-host-zara',
    nickname: 'Zara Live',
    poppoId: '8802194',
    avatarUrl: '/assets/studio/host_zara_avatar.png',
    level: 12,
  });

  const [kpis, setKpis] = useState<KPIs>({
    totalSessions: 24,
    totalDurationSeconds: 173700,
    totalDurationFormatted: '48h 15m',
    totalViewers: 142800,
    totalViewersFormatted: '142.8K',
    totalFollowers: 1850,
    totalFollowersFormatted: '+1.8K',
  });

  const [sessions, setSessions] = useState<PastSession[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadLiveCenter() {
      try {
        setLoading(true);
        const res = await fetch(`/api/live/center/history?filter=${activeFilter}&preview=demo`);
        if (!res.ok) throw new Error('Failed to load live center history');
        const data = await res.json();
        if (isMounted && data.success) {
          if (data.host) setHost(data.host);
          if (data.kpis) setKpis(data.kpis);
          if (Array.isArray(data.sessions)) setSessions(data.sessions);
        }
      } catch (err: any) {
        console.warn('Live center API notice, using fallback:', err?.message || err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadLiveCenter();

    return () => {
      isMounted = false;
    };
  }, [activeFilter]);

  return (
    <div className="min-h-screen bg-[#070817] text-white flex flex-col justify-between selection:bg-pink-500 selection:text-white">
      {/* Background Glows */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#090a23] via-[#070817] to-[#04040d] pointer-events-none" />
      <div className="fixed top-0 right-0 w-96 h-96 bg-pink-600/10 blur-3xl pointer-events-none" />
      <div className="fixed top-1/3 left-0 w-80 h-80 bg-purple-700/10 blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-2xl mx-auto px-4 py-6 flex-1 flex flex-col">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-5 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <button
              data-action="back"
              type="button"
              onClick={() => router.push(`/live/end-screen?roomId=${roomId}`)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 flex items-center justify-center transition"
              title="Back to End Screen"
            >
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-black text-white flex items-center gap-2">
                Live Center
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Host Analytics
                </span>
              </h1>
              <p className="text-xs text-white/50">Streaming history and overall performance</p>
            </div>
          </div>

          {/* Go Live Shortcut Button */}
          <Link
            href="/live/setup"
            className="px-4 py-2 rounded-full bg-gradient-to-r from-[#ff2a54] to-[#f43f5e] hover:brightness-110 active:scale-95 text-white text-xs font-bold shadow-md shadow-pink-500/30 transition flex items-center gap-1.5"
          >
            <span>+ Go Live</span>
          </Link>
        </div>

        {/* Host Profile Bar */}
        <div className="bg-[#121533]/80 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center justify-between mb-6 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="relative w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-[#ff1361] to-[#ff2a85] shadow-lg shadow-pink-500/30">
              <img
                src={host.avatarUrl}
                alt={host.nickname}
                className="w-full h-full rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/studio/host_zara_avatar.png';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">{host.nickname}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-400 to-orange-500 text-black shadow-sm">
                  Lv.{host.level}
                </span>
              </div>
              <p className="text-xs text-white/50 font-mono mt-0.5">ID: {host.poppoId}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              ● Active Broadcaster
            </span>
          </div>
        </div>

        {/* KPI Stats Grid (4 Metric Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {/* Card 1: Total Completed Sessions */}
          <div className="bg-[#121533]/80 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <span className="text-[11px] font-medium text-white/50 block">Completed Sessions</span>
            <span className="text-xl sm:text-2xl font-black text-white block mt-1 tracking-tight">
              {kpis.totalSessions}
            </span>
            <span className="text-[10px] text-purple-400 font-semibold block mt-0.5">Total Broadcasts</span>
          </div>

          {/* Card 2: Total Streaming Time */}
          <div className="bg-[#121533]/80 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <span className="text-[11px] font-medium text-white/50 block">Streaming Time</span>
            <span className="text-xl sm:text-2xl font-black text-pink-400 block mt-1 tracking-tight">
              {kpis.totalDurationFormatted}
            </span>
            <span className="text-[10px] text-white/40 block mt-0.5">On-Air Time</span>
          </div>

          {/* Card 3: Total Viewers */}
          <div className="bg-[#121533]/80 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <span className="text-[11px] font-medium text-white/50 block">Total Viewers</span>
            <span className="text-xl sm:text-2xl font-black text-cyan-400 block mt-1 tracking-tight">
              {kpis.totalViewersFormatted}
            </span>
            <span className="text-[10px] text-white/40 block mt-0.5">Audience Reached</span>
          </div>

          {/* Card 4: Followers Gained */}
          <div className="bg-[#121533]/80 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <span className="text-[11px] font-medium text-white/50 block">Followers Gained</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 block mt-1 tracking-tight">
              {kpis.totalFollowersFormatted}
            </span>
            <span className="text-[10px] text-white/40 block mt-0.5">New Fans</span>
          </div>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">Broadcast History</h3>
          <div className="bg-[#121533] rounded-full p-1 border border-white/10 flex items-center">
            <button
              data-filter="all"
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                activeFilter === 'all'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              data-filter="week"
              type="button"
              onClick={() => setActiveFilter('week')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                activeFilter === 'week'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              This Week
            </button>
            <button
              data-filter="month"
              type="button"
              onClick={() => setActiveFilter('month')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                activeFilter === 'month'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              This Month
            </button>
          </div>
        </div>

        {/* Sessions List or Empty State */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-white/50">Loading session history...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center bg-[#121533]/50 rounded-2xl border border-white/5 p-6">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-3xl mb-3">
              📹
            </div>
            <h4 className="text-base font-bold text-white mb-1">No Completed Sessions Found</h4>
            <p className="text-xs text-white/50 max-w-sm mb-5">
              You haven&apos;t completed any live broadcasts in this time window. Start broadcasting to build your audience!
            </p>
            <Link
              href="/live/setup"
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#ff2a54] to-[#f43f5e] text-white font-bold text-xs shadow-lg shadow-pink-500/30 hover:brightness-110 active:scale-95 transition"
            >
              Start Live Broadcast Now
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sessions.map((s, idx) => (
              <div
                key={s.id || idx}
                className="bg-[#121533]/80 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:border-pink-500/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg"
              >
                {/* Left: Thumbnail & Info */}
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex-shrink-0 relative">
                    <img
                      src={s.coverUrl || '/assets/viewer/sample_viewer_broadcast.png'}
                      alt={s.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/viewer/sample_viewer_broadcast.png';
                      }}
                    />
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/75 text-[9px] font-mono text-white/90">
                      {s.durationFormatted}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white truncate max-w-[220px] sm:max-w-xs">{s.title}</h4>
                    <div className="flex items-center gap-2 text-[11px] text-white/50 mt-0.5">
                      <span className="text-pink-400 font-medium">{s.category}</span>
                      <span>•</span>
                      <span>{new Date(s.startedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Metrics & Action */}
                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <span className="text-xs font-bold text-white block">{s.totalViewersFormatted} viewers</span>
                    <span className="text-[10px] text-emerald-400 block font-medium">+{s.newFollowers} fans</span>
                  </div>

                  <button
                    data-action="view-summary"
                    type="button"
                    onClick={() => router.push(`/live/end-screen?roomId=${s.roomNumber}`)}
                    className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold text-xs border border-white/15 transition flex items-center gap-1"
                  >
                    <span>View Summary</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Official Bottom Footer Banner */}
      <footer className="w-full bg-gradient-to-r from-[#170e33] via-[#24134d] to-[#170e33] border-t border-purple-500/20 py-2.5 px-4 text-center z-20 mt-6">
        <p className="text-xs sm:text-sm font-bold text-white tracking-wide">
          4.8 End Screen & Live Center
        </p>
      </footer>
    </div>
  );
}
