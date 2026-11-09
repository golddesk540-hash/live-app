'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, BellRing, Radio } from 'lucide-react';

export interface FollowedUserItem {
  id: string;
  userId: string;
  nickname: string;
  poppoId?: string;
  avatarUrl: string;
  isLive: boolean;
  roomId?: string | null;
  roomNumber?: string | null;
  roomTitle?: string | null;
  viewerCount?: number;
  viewersFormatted?: string;
  liveNotificationsEnabled?: boolean;
}

interface FollowingUserCardProps {
  user: FollowedUserItem;
  onToggleNotification?: (userId: string, enabled: boolean) => void;
  className?: string;
}

export default function FollowingUserCard({
  user,
  onToggleNotification,
  className = '',
}: FollowingUserCardProps) {
  const router = useRouter();
  const [bellActive, setBellActive] = useState<boolean>(
    user.liveNotificationsEnabled !== false
  );
  const [toggling, setToggling] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleBellClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (toggling) return;

    const nextState = !bellActive;
    setBellActive(nextState);
    setToggling(true);

    const msg = nextState
      ? `Live alerts turned ON for ${user.nickname}`
      : `Live alerts turned OFF for ${user.nickname}`;
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);

    try {
      if (onToggleNotification) {
        onToggleNotification(user.userId || user.id, nextState);
      } else {
        await fetch('/api/discovery/following', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetUserId: user.userId || user.id,
            enabled: nextState,
          }),
        }).catch(() => null);
      }
    } finally {
      setToggling(false);
    }
  };

  const handleCardClick = () => {
    if (user.isLive && (user.roomNumber || user.roomId)) {
      router.push(`/live/room/${user.roomNumber || user.roomId}`);
    } else {
      router.push(`/user/${user.poppoId || user.userId || user.id}`);
    }
  };

  return (
    <div
      data-testid={`following-user-card-${user.userId || user.id}`}
      className={`relative flex items-center justify-between w-full py-3.5 sm:py-4 px-2 sm:px-3 hover:bg-white/[0.03] active:bg-white/[0.06] rounded-2xl transition-all ${className}`}
    >
      {/* LEFT & MIDDLE: Circular Avatar with subtle pink ring + Nickname + Watching Count */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleCardClick();
        }}
        className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1 cursor-pointer"
      >
        {/* Circular Avatar with subtle pink ring matching 03_08_following.png */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full shrink-0 ring-2 ring-pink-500/80 p-[2px] bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 shadow-md shadow-pink-500/20">
          <img
            src={user.avatarUrl || '/avatars/default.png'}
            alt={user.nickname}
            className="w-full h-full rounded-full object-cover"
            loading="lazy"
          />
          {user.isLive && (
            <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-[#080915]" />
          )}
        </div>

        {/* User Nickname & Watching Count */}
        <div className="min-w-0 space-y-1">
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight truncate hover:text-pink-300 transition-colors">
            {user.nickname}
          </h3>

          <p className="text-xs sm:text-sm text-zinc-300 font-medium tracking-wide">
            {user.isLive ? (
              <span>
                {user.viewersFormatted || `${user.viewerCount || 0}`}{' '}
                <span className="text-zinc-400">watching</span>
              </span>
            ) : (
              <span className="text-zinc-500">Offline</span>
            )}
          </p>
        </div>
      </div>

      {/* RIGHT: Pink LIVE Badge + Notification Bell Icon (1:1 with 03_08_following.png) */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0 pl-3">
        {/* Pink LIVE status badge */}
        {user.isLive && (
          <Link
            href={`/live/room/${user.roomNumber || user.roomId || '100220'}`}
            className="px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-[#FF2E74] hover:bg-[#ff1a66] active:scale-95 text-white text-xs sm:text-sm font-extrabold tracking-wider uppercase shadow-md shadow-pink-500/30 transition-all flex items-center justify-center cursor-pointer"
          >
            LIVE
          </Link>
        )}

        {/* Notification Bell Icon */}
        <button
          type="button"
          onClick={handleBellClick}
          aria-label={bellActive ? 'Disable live alerts' : 'Enable live alerts'}
          title={bellActive ? 'Live notifications enabled' : 'Live notifications disabled'}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            bellActive
              ? 'text-white hover:bg-white/10'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
          }`}
        >
          {bellActive ? (
            <Bell className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
          ) : (
            <Bell className="w-5 h-5 sm:w-5.5 sm:h-5.5 opacity-50" />
          )}
        </button>
      </div>

      {/* Feedback Toast */}
      {toastMsg && (
        <div className="absolute -top-3 right-4 z-20 px-3 py-1 rounded-full bg-black/90 border border-pink-500/40 text-[11px] text-pink-300 font-bold shadow-lg animate-fadeIn pointer-events-none">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
