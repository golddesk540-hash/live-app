'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface SessionSummary {
  sessionId: string;
  roomNumber: string;
  title: string;
  category: string;
  coverUrl: string;
  status: string;
  isLive: boolean;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  durationFormatted: string;
  totalViewers: number;
  totalViewersFormatted: string;
  peakViewers: number;
  peakViewersFormatted: string;
  newFollowers: number;
  newFollowersFormatted: string;
  pointsReceived: number;
  pointsReceivedFormatted: string;
  host: {
    id: string;
    nickname: string;
    poppoId: string;
    avatarUrl: string;
    level: number;
    wealthLevel?: number;
  };
}

interface EndScreenProps {
  initialRoomId?: string;
  onOpenLiveCenter?: () => void;
}

export default function EndScreen({ initialRoomId, onOpenLiveCenter }: EndScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = initialRoomId || searchParams.get('roomId') || searchParams.get('sessionId') || '880219';

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Default initial values matching 04_08_end_screen_live_center.png exactly
  const [summary, setSummary] = useState<SessionSummary>({
    sessionId: `room-${roomId}`,
    roomNumber: roomId,
    title: 'Come and chat with me 💕',
    category: 'Live Chat',
    coverUrl: '/assets/viewer/sample_viewer_broadcast.png',
    status: 'ended',
    isLive: false,
    startedAt: new Date(Date.now() - 5076000).toISOString(),
    endedAt: new Date().toISOString(),
    durationSeconds: 5076,
    durationFormatted: '01:24:36',
    totalViewers: 12480,
    totalViewersFormatted: '12,480',
    peakViewers: 3420,
    peakViewersFormatted: '3,420',
    newFollowers: 186,
    newFollowersFormatted: '186',
    pointsReceived: 28400,
    pointsReceivedFormatted: '28,400',
    host: {
      id: 'demo-host-zara',
      nickname: 'Zara Live',
      poppoId: '8802194',
      avatarUrl: '/assets/studio/host_zara_avatar.png',
      level: 12,
      wealthLevel: 12,
    },
  });

  // Fetch session summary from backend
  useEffect(() => {
    let isMounted = true;

    async function fetchSummary() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/live/end-screen/summary?roomId=${roomId}&preview=demo`);
        if (!res.ok) {
          throw new Error(`Failed to load session summary (${res.status})`);
        }
        const data = await res.json();
        if (isMounted && data.success && data.summary) {
          setSummary(data.summary);
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn('Using reference session summary fallback:', err?.message || err);
          // Keep reference fallback
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchSummary();

    return () => {
      isMounted = false;
    };
  }, [roomId]);

  const handleLiveCenterClick = () => {
    if (onOpenLiveCenter) {
      onOpenLiveCenter();
    } else {
      router.push(`/live/center?roomId=${roomId}`);
    }
  };

  const handleReturnHomeClick = () => {
    router.push('/live/explore');
  };

  return (
    <div className="min-h-screen bg-[#070817] text-white flex flex-col items-center justify-between relative overflow-x-hidden selection:bg-pink-500 selection:text-white">
      {/* Background Gradient & Glow Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#090a23] via-[#070817] to-[#04040d] pointer-events-none" />
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-pink-600/15 via-purple-600/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 left-0 w-72 h-72 bg-gradient-to-tr from-purple-800/15 to-transparent blur-3xl pointer-events-none" />

      {/* Main Content Wrapper (Fixed mobile aspect ratio strictly matching 04_08) */}
      <div className="relative z-10 w-full max-w-[360px] sm:max-w-[400px] flex-1 flex flex-col justify-between px-5 pt-7 pb-4">
        
        {/* Top Section: Logo Branding */}
        <div className="flex flex-col items-center">
          {/* Poppo Live Logo */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#ff007f] via-[#7928ca] to-[#0070f3] p-0.5 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <div className="w-full h-full bg-[#12082b] rounded-[10px] flex items-center justify-center text-[11px] font-black tracking-tight text-white">
                Po
              </div>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white flex items-center">
              Poppo<span className="text-[#ff2a85] ml-1">Live</span>
            </span>
          </div>

          {/* Heading: ✔ LIVE Ended */}
          <div className="flex items-center gap-2.5 my-3">
            <div className="w-6 h-6 rounded-full bg-[#6d28d9] flex items-center justify-center text-white text-xs font-bold shadow-md shadow-purple-600/40">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-black tracking-wide text-white">LIVE Ended</h1>
          </div>

          {/* Host Avatar with Neon Pink Circular Ring */}
          <div className="relative my-4 flex items-center justify-center">
            {/* Outer pink glow halo */}
            <div className="absolute inset-0 rounded-full bg-[#ff2a85] blur-md opacity-60 scale-105" />
            {/* Circular Ring & Photo */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full p-[3px] bg-gradient-to-tr from-[#ff1361] to-[#ff2a85] shadow-[0_0_20px_rgba(255,42,133,0.6)]">
              <img
                src={summary.host?.avatarUrl || '/assets/studio/host_zara_avatar.png'}
                alt={summary.host?.nickname || 'Host'}
                className="w-full h-full rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/studio/host_zara_avatar.png';
                }}
              />
            </div>
          </div>
        </div>

        {/* Middle Section: Session Statistics Card */}
        <div className="w-full my-4">
          <div className="bg-[#121533]/85 backdrop-blur-xl rounded-[26px] p-5 border border-white/10 shadow-2xl">
            {/* Row 1: Live Duration & Total Viewers */}
            <div className="flex items-start justify-between pb-3.5">
              <div>
                <span className="text-[11px] font-medium text-white/50 block">Live Duration</span>
                <span className="text-sm font-bold text-white block mt-1">Total Viewers</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-semibold text-white/60 block tracking-wider">
                  Total {summary.durationFormatted || '01:24:36'}
                </span>
                <span className="text-xl sm:text-2xl font-black text-white block mt-0.5 tracking-tight">
                  {summary.totalViewersFormatted || '12,480'}
                </span>
              </div>
            </div>

            {/* Subtle Divider */}
            <div className="w-full h-[1px] bg-white/[0.08] my-1" />

            {/* Row 2: New Followers & Total Gifts/Points */}
            <div className="flex items-start justify-between pt-3.5">
              <div>
                <span className="text-[11px] font-medium text-white/50 block">New Followers</span>
                <span className="text-sm font-bold text-white block mt-1">
                  {summary.newFollowersFormatted || '186'} Received
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-semibold text-white/60 block">Total Gifts</span>
                <span className="text-xl sm:text-2xl font-black text-white block mt-0.5 tracking-tight">
                  {summary.pointsReceivedFormatted || '28,400'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="w-full flex flex-col gap-3 mt-2 mb-4">
          {/* Primary Button: Live Center */}
          <button
            data-action="live-center"
            type="button"
            onClick={handleLiveCenterClick}
            className="w-full py-3.5 sm:py-4 rounded-full bg-[#ff206e] hover:bg-[#ff1165] active:scale-95 text-white font-bold text-sm sm:text-base shadow-lg shadow-pink-500/40 hover:shadow-pink-500/60 transition-all text-center flex items-center justify-center gap-2"
          >
            <span>Live Center</span>
          </button>

          {/* Secondary Button: Return to Home */}
          <button
            data-action="return-home"
            type="button"
            onClick={handleReturnHomeClick}
            className="w-full py-3.5 sm:py-4 rounded-full bg-[#181a38] hover:bg-[#20234a] border border-white/10 active:scale-95 text-white/90 hover:text-white font-bold text-sm sm:text-base transition-all text-center flex items-center justify-center gap-2"
          >
            <span>Return to Home</span>
          </button>
        </div>
      </div>

      {/* Official Bottom Footer Banner Matching Reference */}
      <footer className="w-full bg-gradient-to-r from-[#170e33] via-[#24134d] to-[#170e33] border-t border-purple-500/20 py-2.5 px-4 text-center z-20">
        <p className="text-xs sm:text-sm font-bold text-white tracking-wide">
          4.8 End Screen & Live Center
        </p>
      </footer>
    </div>
  );
}
