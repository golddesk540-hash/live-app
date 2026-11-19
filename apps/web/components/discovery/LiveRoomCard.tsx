'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Eye,
  MoreVertical,
  Share2,
  Copy,
  Check,
  Radio,
  Swords,
  ShieldCheck,
} from 'lucide-react';
import type { FixtureLiveRoom } from '@/lib/design/designFixtures';

export interface RoomHostData {
  id?: string;
  nickname: string;
  poppoId?: string;
  avatarUrl: string;
  hostLevel?: number;
  wealthLevel?: number;
  isVerified?: boolean;
}

export interface LiveRoomCardData {
  id?: string;
  roomId?: string;
  roomNumber?: string;
  title: string;
  coverUrl: string;
  category: string;
  status?: string;
  isLive?: boolean;
  isPk?: boolean;
  isPkActive?: boolean;
  viewerCount: number;
  viewersFormatted?: string;
  country?: string;
  countryCode?: string;
  flagEmoji?: string;
  hostNickname?: string;
  hostAvatar?: string;
  host?: RoomHostData;
  tags?: string[];
  coinsEarned?: number;
  [key: string]: any;
}

export interface LiveRoomCardProps {
  room: FixtureLiveRoom | LiveRoomCardData;
  className?: string;
  onShare?: (room: any) => void;
}

const LOCAL_FALLBACK_COVERS: Record<string, string> = {
  room_001: '/assets/viewer/sample_viewer_broadcast.png',
  room_002: '/assets/following/sana_khan.png',
  room_003: '/assets/following/mehak.png',
  room_004: '/assets/following/alina.png',
  room_005: '/assets/following/zara_live.png',
  room_006: '/assets/following/mehak@2x.png',
  room_007: '/assets/following/alina@2x.png',
  room_008: '/assets/following/sana_khan@2x.png',
};

export const LiveRoomCard: React.FC<LiveRoomCardProps> = ({
  room,
  className = '',
  onShare,
}) => {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Normalize room fields
  const roomId = room.id || (room as any).roomId || (room as any).roomNumber || 'room_001';
  const roomNumber = (room as any).roomNumber || roomId;
  const hostName =
    room.hostNickname ||
    ('host' in room && room.host?.nickname) ||
    'Broadcaster';
  const hostAvatar =
    room.hostAvatar ||
    ('host' in room && room.host?.avatarUrl) ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
  const flagEmoji = room.flagEmoji || '🇵🇰';
  const countryName = room.country || 'Pakistan';
  const isPk = Boolean(room.isPkActive || (room as any).isPk);
  const isLive = room.isLive !== false;
  const viewerCountNumber = room.viewerCount || 0;
  const viewerDisplay =
    (room as any).viewersFormatted || viewerCountNumber.toLocaleString();

  const fallbackCover =
    LOCAL_FALLBACK_COVERS[roomId] ||
    LOCAL_FALLBACK_COVERS[roomNumber] ||
    '/assets/viewer/sample_viewer_broadcast.png';

  const [coverSource, setCoverSource] = useState<string>(room.coverUrl || fallbackCover);

  // Close dropdown menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const targetUrl = `/live/room/${roomId}`;

  const handleCardClick = (e: React.MouseEvent) => {
    if (menuOpen) return;
    router.push(targetUrl);
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setMenuOpen(!menuOpen);
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const fullUrl = `${window.location.origin}${targetUrl}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(fullUrl);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setMenuOpen(false);
    } catch (err) {
      console.error('Failed to copy room link:', err);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setMenuOpen(false);
    if (onShare) {
      onShare(room);
    } else if (navigator.share) {
      navigator.share({
        title: `${room.title} - ${hostName} on Popo Live`,
        text: `Watch ${hostName} live streaming on Popo Live!`,
        url: `${window.location.origin}${targetUrl}`,
      }).catch(() => {});
    } else {
      handleCopyLink(e);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group flex flex-col space-y-2 select-none cursor-pointer ${className}`}
      data-testid={`live-room-card-${roomId}`}
    >
      {/* 1. PORTRAIT CARD CONTAINER (3:4 ASPECT RATIO) */}
      <div className="relative aspect-[3/4] w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-pink-900/30 via-gray-900 to-purple-900/30 border border-gray-200/90 shadow-xs group-hover:shadow-lg group-hover:border-pink-300 transition-all duration-300 transform group-hover:-translate-y-1">
        {/* Cover Image */}
        <img
          src={coverSource}
          alt={room.title}
          onError={() => {
            if (coverSource !== fallbackCover) {
              setCoverSource(fallbackCover);
            } else if (coverSource !== hostAvatar) {
              setCoverSource(hostAvatar);
            }
          }}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Top & Bottom Vignettes for Contrast */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

        {/* TOP-LEFT: LIVE BADGE & PK BADGE */}
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
          {isLive ? (
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#FF1A6C] to-[#E0125C] text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>LIVE</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-800/80 backdrop-blur-xs text-gray-300 text-[10px] font-bold">
              <span>ENDED</span>
            </div>
          )}

          {isPk && (
            <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[9px] font-black shadow-md flex items-center gap-1">
              <Swords className="w-3 h-3" />
              <span>PK</span>
            </div>
          )}
        </div>

        {/* TOP-RIGHT: VIEWER COUNT */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-xs px-2.5 py-1 rounded-full text-white text-[11px] font-bold shadow-md border border-white/20">
            <Eye className="w-3.5 h-3.5 text-gray-200" />
            <span>{viewerDisplay}</span>
          </div>
        </div>

        {/* BOTTOM-LEFT: CATEGORY TAG OVER IMAGE */}
        <div className="absolute bottom-2.5 left-2.5 z-10">
          <span className="px-2.5 py-0.5 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold border border-white/10">
            {room.category}
          </span>
        </div>

        {/* BOTTOM-RIGHT: 3-DOTS ACTION TRIGGER */}
        <div className="absolute bottom-2 right-2 z-20" ref={menuRef}>
          <button
            type="button"
            onClick={handleMenuToggle}
            aria-label="Room actions"
            className="p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white/90 hover:text-white transition-colors focus:outline-none"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {/* Action Popover Menu */}
          {menuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 bottom-full mb-1.5 w-40 rounded-2xl bg-white border border-gray-200 shadow-xl p-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150"
            >
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  router.push(targetUrl);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-pink-50 hover:text-[#FF1A6C] rounded-xl transition-colors text-left"
              >
                <Radio className="w-3.5 h-3.5 text-[#FF1A6C]" />
                <span>Watch Live</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-100 rounded-xl transition-colors text-left"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-100 rounded-xl transition-colors text-left"
              >
                <Share2 className="w-3.5 h-3.5 text-purple-500" />
                <span>Share</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. HOST INFORMATION & ROOM TITLE BELOW THE CARD */}
      <div className="space-y-0.5 px-1">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <img
              src={hostAvatar}
              alt={hostName}
              onError={(e) => {
                (e.target as HTMLImageElement).src = fallbackCover;
              }}
              className="w-4 h-4 rounded-full object-cover shrink-0 ring-1 ring-gray-200"
            />
            <span className="text-xs sm:text-sm font-extrabold text-gray-900 truncate group-hover:text-[#FF1A6C] transition-colors">
              {hostName}
            </span>
          </div>
          <span
            className="text-xs font-semibold text-gray-500 bg-gray-100/90 px-1.5 py-0.5 rounded-md shrink-0"
            title={countryName}
          >
            {flagEmoji}
          </span>
        </div>

        <p className="text-[11px] text-gray-500 truncate font-medium">
          {room.title}
        </p>
      </div>
    </div>
  );
};

export default LiveRoomCard;
