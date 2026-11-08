'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Mic, MicOff, Lock, Plus, Crown } from 'lucide-react';

export interface SeatUser {
  seatIndex: number;
  isHost?: boolean;
  name?: string;
  avatar?: string;
  level?: number;
  isSpeaking?: boolean;
  isMuted?: boolean;
  isLocked?: boolean;
}

export interface NineSeatPartyPreviewProps {
  roomTitle?: string;
  hostName?: string;
  seats?: SeatUser[];
  className?: string;
}

export const NineSeatPartyPreview: React.FC<NineSeatPartyPreviewProps> = ({
  roomTitle = '✨ Late Night Urdu Ghazal & Chill Club ✨',
  seats = [
    {
      seatIndex: 0,
      isHost: true,
      name: 'Malik (Host)',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      level: 48,
      isSpeaking: true,
    },
    {
      seatIndex: 1,
      name: 'Zara',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      level: 22,
      isSpeaking: false,
    },
    {
      seatIndex: 2,
      name: 'Hamza',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      level: 19,
      isMuted: true,
    },
    {
      seatIndex: 3,
      name: 'Areeba',
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
      level: 31,
      isSpeaking: true,
    },
    { seatIndex: 4, isLocked: false },
    { seatIndex: 5, isLocked: false },
    { seatIndex: 6, isLocked: true },
    { seatIndex: 7, isLocked: false },
    { seatIndex: 8, isLocked: false },
  ],
  className,
}) => {
  const hostSeat = seats.find((s) => s.isHost) || seats[0];
  const guestSeats = seats.filter((s) => !s.isHost).slice(0, 8);

  return (
    <div
      className={cn(
        'w-full max-w-xl mx-auto rounded-3xl bg-gradient-to-b from-[#18122B] via-popo-dark-900 to-popo-dark-950 p-6 border border-popo-purple/30 shadow-2xl relative overflow-hidden',
        className
      )}
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 bg-popo-purple/20 blur-3xl pointer-events-none" />

      {/* Room Header */}
      <div className="text-center mb-6 relative z-10">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-popo-pink px-2.5 py-0.5 rounded-full bg-popo-pink/10 border border-popo-pink/20">
          9-Seat Voice Party Room (Phase 5 Reference)
        </span>
        <h3 className="text-base md:text-lg font-bold text-white mt-1.5">{roomTitle}</h3>
      </div>

      {/* Host Seat (Center Top) */}
      <div className="flex flex-col items-center justify-center mb-6 relative z-10">
        <div className="relative">
          {/* Host Crown */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 bg-amber-400 p-0.5 rounded-full shadow-glow-gold">
            <Crown className="w-4 h-4 text-black fill-black" />
          </div>

          <Avatar
            src={hostSeat.avatar}
            size="lg"
            ring={hostSeat.isSpeaking ? 'live' : 'vip'}
            level={hostSeat.level}
          />

          {/* Audio Wave / Mic Indicator */}
          <div className="absolute -bottom-1 -right-1 bg-popo-pink text-white p-1 rounded-full text-xs shadow-glow-pink">
            {hostSeat.isMuted ? <MicOff className="w-3 h-3 text-red-400" /> : <Mic className="w-3 h-3" />}
          </div>
        </div>
        <span className="text-xs font-bold text-white mt-2 flex items-center gap-1">
          {hostSeat.name}
        </span>
        <span className="text-[10px] font-extrabold text-amber-400">👑 Room Owner</span>
      </div>

      {/* 8 Guest Seats Grid (4 columns x 2 rows) */}
      <div className="grid grid-cols-4 gap-4 p-4 rounded-2xl bg-black/40 border border-white/5 relative z-10">
        {guestSeats.map((guest, idx) => {
          const isOccupied = Boolean(guest?.avatar);

          return (
            <div key={idx} className="flex flex-col items-center justify-center gap-1.5">
              {isOccupied ? (
                <div className="relative">
                  <Avatar
                    src={guest.avatar}
                    size="md"
                    ring={guest.isSpeaking ? 'seat' : 'none'}
                    level={guest.level}
                  />
                  <div
                    className={cn(
                      'absolute -bottom-0.5 -right-0.5 p-0.5 rounded-full text-[9px] shadow-sm',
                      guest.isMuted
                        ? 'bg-red-500 text-white'
                        : guest.isSpeaking
                        ? 'bg-popo-cyan text-black'
                        : 'bg-popo-dark-700 text-white'
                    )}
                  >
                    {guest.isMuted ? (
                      <MicOff className="w-2.5 h-2.5" />
                    ) : (
                      <Mic className="w-2.5 h-2.5" />
                    )}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className={cn(
                    'w-11 h-11 rounded-full flex items-center justify-center transition-colors',
                    guest?.isLocked
                      ? 'bg-white/5 text-popo-text-muted border border-white/10 cursor-not-allowed'
                      : 'bg-white/5 hover:bg-popo-pink/20 text-popo-text-secondary hover:text-popo-pink border border-dashed border-white/20'
                  )}
                >
                  {guest?.isLocked ? <Lock className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              )}

              <span className="text-[11px] font-medium text-popo-text-secondary truncate max-w-[64px]">
                {isOccupied ? guest.name : guest?.isLocked ? 'Locked' : `Seat ${idx + 1}`}
              </span>
            </div>
          );
        })}
      </div>

      {/* Audio controls bar */}
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-popo-text-secondary px-2">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>High-Fidelity Stereo Audio</span>
        </span>
        <button className="text-popo-pink font-bold hover:underline">
          Request Seat 🎙️
        </button>
      </div>
    </div>
  );
};
