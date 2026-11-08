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
  User,
  Radio,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export interface RoomHost {
  id: string;
  nickname: string;
  poppoId?: string;
  avatarUrl: string;
  gender?: string;
  hostLevel?: number;
  wealthLevel?: number;
  isVerified?: boolean;
}

export interface RoomItemData {
  roomId: string;
  roomNumber: string;
  title: string;
  coverUrl: string;
  category: string;
  status?: string;
  isLive?: boolean;
  isPk?: boolean;
  viewerCount: number;
  viewersFormatted: string;
  coinsEarned?: number;
  coinsFormatted?: string;
  country?: string;
  countryCode: string;
  flagEmoji: string;
  tags?: string[];
  host: RoomHost;
  pkDetails?: any;
}

interface LiveRoomCardProps {
  room: RoomItemData;
  className?: string;
  onShare?: (room: RoomItemData) => void;
}

export default function LiveRoomCard({ room, className = '', onShare }: LiveRoomCardProps) {
  const router = useRouter();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close 3-dots menu on outside click
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

  // Safe fallback cover image
  const fallbackCover = room.host?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600';
  const displayCover = imageError ? fallbackCover : (room.coverUrl || fallbackCover);

  const isActuallyLive = room.isLive !== false && room.status !== 'ended' && room.status !== 'offline';
  const isEnded = room.status === 'ended';
  const isOffline = room.status === 'offline';

  // Room tags with fallback matching 03_04 reference
  const tags = Array.isArray(room.tags) && room.tags.length > 0
    ? room.tags.slice(0, 3)
    : [room.isPk ? 'PK' : 'Live', room.category || 'Fun', 'Chat'];

  const roomLink = `/live/room/${room.roomId || room.roomNumber}`;
  const hostProfileLink = `/user/${room.host?.id || room.host?.poppoId}`;

  const handleCardClick = (e: React.MouseEvent) => {
    // If clicking action menu, do nothing
    if (menuOpen) return;
    router.push(roomLink);
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setMenuOpen(!menuOpen);
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const fullUrl = `${window.location.origin}${roomLink}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(fullUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = fullUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setMenuOpen(false);
    } catch (err) {
      console.error('Failed to copy room link:', err);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setMenuOpen(false);
    if (onShare) {
      onShare(room);
      return;
    }
    const fullUrl = `${window.location.origin}${roomLink}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${room.title} - ${room.host?.nickname} on Popo Live`,
          text: `Watch ${room.host?.nickname} live on Popo Live!`,
          url: fullUrl,
        });
      } catch (err) {
        // user cancelled share
      }
    } else {
      handleCopyLink(e);
    }
  };

  const handleOpenHostProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(hostProfileLink);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative rounded-2xl sm:rounded-3xl overflow-hidden aspect-[3/4] bg-[#120e26] border border-white/10 shadow-lg hover:border-pink-500/50 hover:shadow-pink-500/20 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer select-none ${className}`}
      data-testid={`room-card-${room.roomId}`}
    >
      {/* Background Image Loading Skeleton */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/40 via-zinc-900 to-black animate-pulse" />
      )}

      {/* Room Cover Image */}
      <img
        src={displayCover}
        alt={room.title}
        loading="lazy"
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          setImageError(true);
          setImageLoaded(true);
        }}
        className={`w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        } ${isOffline || isEnded ? 'grayscale contrast-75' : ''}`}
      />

      {/* Top & Bottom Vignettes for Maximum Readability */}
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/70 via-black/25 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 pt-16 pb-3 px-3 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none" />

      {/* TOP-LEFT: LIVE / OFFLINE / ENDED Badge */}
      <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
        {isActuallyLive ? (
          <div className="flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-0.5 rounded-full bg-gradient-to-r from-[#ff2d55] to-[#ff1493] text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-md shadow-pink-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>LIVE</span>
          </div>
        ) : isOffline ? (
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-800/80 backdrop-blur-md text-zinc-300 text-[10px] font-bold border border-white/10">
            <span>OFFLINE</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-950/80 backdrop-blur-md text-red-300 text-[10px] font-bold border border-red-500/20">
            <span>ENDED</span>
          </div>
        )}

        {/* PK indicator if active battle */}
        {room.isPk && (
          <div className="px-2 py-0.5 rounded-full bg-purple-600/90 backdrop-blur-md text-white text-[9px] font-extrabold shadow-md flex items-center gap-1">
            <span>⚔️</span>
            <span>PK</span>
          </div>
        )}
      </div>

      {/* TOP-RIGHT: Viewer Count Badge */}
      <div className="absolute top-2.5 right-2.5 z-10">
        <div className="flex items-center gap-1.5 bg-black/45 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 text-white shadow-md">
          <Eye className="w-3.5 h-3.5 text-white/90" />
          <span className="text-[11px] sm:text-xs font-bold tracking-tight">
            {room.viewersFormatted || '0'}
          </span>
        </div>
      </div>

      {/* BOTTOM CONTENT AREA */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 flex flex-col gap-1.5">
        {/* Host Nickname & Verification */}
        <div className="flex items-center justify-between gap-1">
          <div
            onClick={handleOpenHostProfile}
            className="flex items-center gap-1.5 max-w-[80%] hover:underline cursor-pointer group/host"
          >
            <span className="text-xs sm:text-sm font-extrabold text-white truncate drop-shadow-md">
              {room.host?.nickname || room.title}
            </span>
            {room.host?.isVerified && (
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400 fill-sky-400 flex-shrink-0" />
            )}
            <span className="text-xs leading-none flex-shrink-0 drop-shadow">
              {room.flagEmoji}
            </span>
          </div>

          {/* 3-DOTS ACTION MENU TRIGGER */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={handleMenuToggle}
              aria-label="Room actions"
              className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors focus:outline-none"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* ACTION DROPDOWN POPOVER */}
            {menuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 bottom-full mb-1.5 w-44 rounded-2xl bg-[#1b1534]/95 backdrop-blur-xl border border-white/15 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    router.push(roomLink);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-white hover:bg-pink-600/20 hover:text-pink-300 rounded-xl transition-colors text-left"
                >
                  <Radio className="w-3.5 h-3.5 text-pink-400" />
                  <span>Open Room</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    setMenuOpen(false);
                    handleOpenHostProfile(e);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-white hover:bg-white/10 rounded-xl transition-colors text-left"
                >
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span>Host Profile</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-white hover:bg-white/10 rounded-xl transition-colors text-left"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>{copied ? 'Copied! ✓' : 'Copy Room Link'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-white hover:bg-white/10 rounded-xl transition-colors text-left"
                >
                  <Share2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Share Room</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Poppo ID where permitted */}
        {room.host?.poppoId && (
          <div className="flex items-center gap-1 text-[10px] text-white/60 font-mono tracking-tight">
            <span>ID:</span>
            <span>{room.host.poppoId}</span>
          </div>
        )}

        {/* TAGS ROW (Exact styling from reference 03_04_room_cards.png) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {tags.map((tag, idx) => {
            let tagStyle = 'bg-white/15 backdrop-blur-md text-white/90 border border-white/10';
            if (idx === 0) {
              // 1st tag: pink / magenta gradient
              tagStyle = 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm shadow-pink-500/30';
            } else if (idx === 1) {
              // 2nd tag: purple
              tagStyle = 'bg-purple-600/80 backdrop-blur-md text-white';
            }
            return (
              <span
                key={idx}
                className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full ${tagStyle}`}
              >
                {tag}
              </span>
            );
          })}
        </div>
      </div>

      {/* COPIED TOAST POPUP */}
      {copied && (
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-30 bg-black/90 backdrop-blur-md text-white py-2 px-3 rounded-xl border border-pink-500/50 text-center shadow-2xl animate-in fade-in zoom-in-95">
          <p className="text-xs font-bold text-pink-300 flex items-center justify-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-green-400" />
            <span>Link Copied!</span>
          </p>
        </div>
      )}
    </div>
  );
}
