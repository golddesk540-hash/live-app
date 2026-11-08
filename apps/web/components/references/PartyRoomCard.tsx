'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Mic, Users } from 'lucide-react';

export interface PartyRoomCardProps {
  id: string;
  roomName: string;
  hostName: string;
  hostAvatar: string;
  activeSeats: number; // e.g. 5 out of 9
  themeColor?: string;
  category?: string;
  onClick?: () => void;
  className?: string;
}

export const PartyRoomCard: React.FC<PartyRoomCardProps> = ({
  roomName,
  hostName,
  hostAvatar,
  activeSeats = 6,
  category = 'Voice Lounge',
  onClick,
  className,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative p-4 rounded-2xl bg-gradient-to-br from-popo-dark-850 to-popo-dark-900 border border-white/10 hover:border-popo-purple/50 hover:shadow-lg transition-all duration-300 cursor-pointer text-left',
        className
      )}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 truncate">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hostAvatar}
              alt={hostName}
              className="w-10 h-10 rounded-full object-cover border border-popo-purple"
            />
            <span className="absolute -bottom-1 -right-1 bg-popo-purple text-white p-0.5 rounded-full text-[9px]">
              <Mic className="w-2.5 h-2.5" />
            </span>
          </div>
          <div className="truncate">
            <h4 className="text-sm font-bold text-white truncate">{roomName}</h4>
            <span className="text-xs text-popo-text-secondary truncate block">Host: {hostName}</span>
          </div>
        </div>

        <Badge variant="party" size="xs">
          {activeSeats}/9 Seats
        </Badge>
      </div>

      {/* 9 Mini Seat Representation */}
      <div className="bg-black/30 rounded-xl p-2.5 mb-3 border border-white/5">
        <div className="grid grid-cols-5 gap-1.5 items-center justify-items-center">
          {/* Seat 0 (Host) */}
          <div className="col-span-5 flex justify-center mb-1">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-[10px] font-bold text-black border border-white/20">
              👑
            </div>
          </div>
          {/* 8 Guest Seats */}
          {Array.from({ length: 8 }).map((_, i) => {
            const isOccupied = i < activeSeats - 1;
            return (
              <div
                key={i}
                className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all',
                  isOccupied
                    ? 'bg-popo-purple/40 text-popo-cyan border border-popo-cyan/40'
                    : 'bg-white/5 text-popo-text-muted border border-dashed border-white/10'
                )}
              >
                {isOccupied ? '🎙️' : '+'}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs text-popo-text-muted pt-1 border-t border-white/5">
        <span className="text-[11px] font-medium text-popo-cyan">{category}</span>
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3 text-popo-text-secondary" />
          <span>{activeSeats * 14 + 18} Listening</span>
        </div>
      </div>
    </div>
  );
};
