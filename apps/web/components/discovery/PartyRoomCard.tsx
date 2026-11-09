'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Users, ChevronRight, Radio, Sparkles, Volume2, X, ExternalLink, ShieldCheck } from 'lucide-react';

export interface PartyRoomItem {
  id: string;
  roomNumber: string;
  title: string;
  collageUrl: string;
  currentMembers: number;
  maxMembers?: number;
  seatCountFormatted?: string;
  isLive?: boolean;
  status?: string;
  category?: string;
  country?: string;
  countryCode?: string;
  flagEmoji?: string;
  hostNickname?: string;
  hostAvatar?: string;
  tags?: string[];
}

interface PartyRoomCardProps {
  room: PartyRoomItem;
  onClick?: (room: PartyRoomItem) => void;
  className?: string;
}

export default function PartyRoomCard({ room, onClick, className = '' }: PartyRoomCardProps) {
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [imgError, setImgError] = useState(false);

  const maxSeats = room.maxMembers || 9;
  const currentCount = room.currentMembers ?? 1;
  const seatDisplay = room.seatCountFormatted || `${currentCount} / ${maxSeats}`;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick) {
      onClick(room);
    } else {
      setShowPreviewModal(true);
    }
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClick(e as any);
          }
        }}
        data-testid={`party-room-card-${room.roomNumber}`}
        className={`group relative flex items-center justify-between w-full px-3.5 py-3 sm:px-4 sm:py-3.5 rounded-2xl bg-[#14172f] hover:bg-[#1a1f3e] active:scale-[0.99] border border-white/5 hover:border-white/10 shadow-lg shadow-black/20 cursor-pointer transition-all duration-200 ${className}`}
      >
        {/* LEFT: 2x2 Collage Image matching 03_06_party_discovery_list.png */}
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
          <div className="relative w-[78px] h-[54px] sm:w-[84px] sm:h-[58px] rounded-xl overflow-hidden bg-[#0a0c1a] border border-white/10 shrink-0 shadow-md">
            {!imgError ? (
              <img
                src={room.collageUrl}
                alt={room.title}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            ) : (
              /* Fallback 2x2 simulated avatar collage if image not found */
              <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-0.5 p-0.5 bg-gradient-to-br from-purple-950 to-indigo-950">
                <div className="rounded-md bg-purple-600/40 flex items-center justify-center text-[10px]">👤</div>
                <div className="rounded-md bg-pink-600/40 flex items-center justify-center text-[10px]">👤</div>
                <div className="rounded-md bg-blue-600/40 flex items-center justify-center text-[10px]">👤</div>
                <div className="rounded-md bg-indigo-600/40 flex items-center justify-center text-[10px]">👤</div>
              </div>
            )}

            {/* Subtle live indicator dot */}
            <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#14172f]" />
          </div>

          {/* MIDDLE: Room Title and Member Count (9-seat capacity) */}
          <div className="flex flex-col justify-center min-w-0 space-y-1">
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate group-hover:text-pink-300 transition-colors">
              {room.title}
            </h3>

            <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-medium">
              <Users className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="tracking-wide">{seatDisplay}</span>
            </div>
          </div>
        </div>

        {/* RIGHT: Navigation Chevron Arrow */}
        <div className="pl-2 shrink-0">
          <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-200" />
        </div>
      </div>

      {/* SAFE DETAIL PREVIEW MODAL (Strict Phase Boundary: No WebRTC engine, purely preview) */}
      {showPreviewModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            className="relative w-full max-w-md bg-[#111327] border border-white/10 rounded-3xl p-5 shadow-2xl text-white space-y-5 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-fuchsia-600/20 text-fuchsia-300 border border-fuchsia-500/30 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Radio className="w-3 h-3 text-pink-400 animate-pulse" />
                  9-Seat Party Room
                </span>
                <span className="text-xs text-white/50">#{room.roomNumber}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Room Banner & Info */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-14 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-[#080915]">
                <img src={room.collageUrl} alt={room.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <h2 className="text-base font-bold text-white truncate">{room.title}</h2>
                <p className="text-xs text-white/60 flex items-center gap-1.5">
                  <span>Host: {room.hostNickname || 'PopoHost'}</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                </p>
                <p className="text-xs text-fuchsia-300 font-semibold flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {seatDisplay} seats occupied
                </p>
              </div>
            </div>

            {/* 9-Seat Visual Grid Representation */}
            <div className="p-3.5 rounded-2xl bg-[#090b17] border border-white/5 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] text-white/50 font-semibold uppercase">
                <span>9-Seat Audio Stage Preview</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Stage
                </span>
              </div>

              {/* Host Seat Top Center */}
              <div className="flex justify-center pb-1">
                <div className="flex flex-col items-center">
                  <div className="w-11 h-11 rounded-full ring-2 ring-fuchsia-500 bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shadow-lg text-white font-bold text-xs relative">
                    👑
                    <span className="absolute -bottom-1 px-1.5 py-0.2 bg-fuchsia-600 rounded-full text-[8px] font-black uppercase">
                      Host
                    </span>
                  </div>
                  <span className="text-[10px] text-white/80 mt-1 font-semibold truncate max-w-[80px]">
                    {room.hostNickname || 'Host'}
                  </span>
                </div>
              </div>

              {/* 8 Guest Seats in 2 Rows of 4 */}
              <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                {Array.from({ length: 8 }).map((_, idx) => {
                  const isOccupied = idx < Math.max(0, currentCount - 1);
                  return (
                    <div key={idx} className="flex flex-col items-center space-y-1">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center border text-[11px] transition-all ${
                          isOccupied
                            ? 'bg-purple-900/40 border-purple-400/40 text-purple-200'
                            : 'bg-white/5 border-dashed border-white/20 text-white/30'
                        }`}
                      >
                        {isOccupied ? '🎤' : idx + 1}
                      </div>
                      <span className="text-[9px] text-white/50 truncate w-full">
                        {isOccupied ? `Seat ${idx + 1}` : 'Open'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Note & Actions */}
            <p className="text-[11px] text-white/40 text-center leading-relaxed">
              Full 9-seat WebRTC audio engine, microphone controls, and seat requests will unlock in the upcoming room streaming module.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPreviewModal(false);
                  window.location.href = `/live/room/${room.roomNumber}?type=party`;
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-500 hover:brightness-110 text-white text-xs font-extrabold shadow-lg shadow-pink-500/30 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Enter Room</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
