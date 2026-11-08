'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/IconButton';
import { Button } from '@/components/ui/Button';
import { X, Gift, Send, Swords, Share2, Sparkles, Plus } from 'lucide-react';

export interface LiveRoomOverlayProps {
  streamerName?: string;
  streamerAvatar?: string;
  streamerLevel?: number;
  viewerCount?: string | number;
  points?: number;
  className?: string;
}

export const LiveRoomOverlay: React.FC<LiveRoomOverlayProps> = ({
  streamerName = 'Noor Fatima 🇵🇰',
  streamerAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  streamerLevel = 36,
  viewerCount = '3.8k',
  points = 184500,
  className,
}) => {
  const sampleMessages = [
    { user: 'Sultan_99', level: 52, vip: true, text: 'Hello Noor! Welcome to live streaming 🔥' },
    { user: 'Hamza_Karachi', level: 18, text: 'Ghazal sunayein please!' },
    { user: 'Zoya_Star', level: 27, text: 'Sent you roses! 🌹🌹🌹' },
    { user: 'Babar_Khan', level: 64, vip: true, isGift: true, text: 'sent 🚀 Space Shuttle (10,000 Coins)' },
  ];

  return (
    <div
      className={cn(
        'relative aspect-[9/16] max-w-sm mx-auto rounded-3xl overflow-hidden bg-popo-dark-950 border border-white/10 shadow-2xl flex flex-col justify-between p-4 select-none',
        className
      )}
    >
      {/* Background Live Stream Simulator */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80"
        alt="Live video stream"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Dark overlay gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-black/70 pointer-events-none" />

      {/* TOP BAR */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        {/* Streamer Capsule */}
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-full p-1 pr-3 border border-white/10">
          <Avatar src={streamerAvatar} size="sm" ring="live" />
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-white truncate max-w-[90px]">{streamerName}</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-amber-400 font-extrabold flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5 fill-amber-400" />
                {points.toLocaleString()}
              </span>
            </div>
          </div>
          <Button
            variant="primary"
            size="xs"
            leftIcon={<Plus className="w-2.5 h-2.5" />}
            className="h-6 px-2 text-[10px]"
          >
            Follow
          </Button>
        </div>

        {/* Viewers & Close */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-xs font-bold border border-white/10">
            <span className="w-2 h-2 rounded-full bg-popo-live animate-ping" />
            <span>{viewerCount}</span>
          </div>
          <IconButton variant="glass" size="sm" aria-label="Close stream">
            <X className="w-4 h-4" />
          </IconButton>
        </div>
      </div>

      {/* PK Battle Banner Reference */}
      <div className="relative z-10 self-center bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 px-3 py-1 rounded-full text-[11px] font-black tracking-wider text-white shadow-glow-pink flex items-center gap-1.5">
        <Swords className="w-3.5 h-3.5" />
        <span>PK BATTLE ACTIVE — 02:45</span>
      </div>

      {/* BOTTOM SECTION: Live Chat & Action Tray */}
      <div className="relative z-10 flex flex-col gap-3">
        {/* Chat Feed */}
        <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto no-scrollbar mask-fade">
          {sampleMessages.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                'inline-flex items-start gap-1.5 px-3 py-1.5 rounded-2xl text-xs backdrop-blur-md max-w-[90%]',
                msg.isGift
                  ? 'bg-gradient-to-r from-amber-500/30 to-purple-500/30 border border-amber-400/40 text-amber-300 font-bold'
                  : 'bg-black/40 text-white border border-white/5'
              )}
            >
              <Badge variant="level" level={msg.level} size="xs" />
              {msg.vip && <Badge variant="vip" size="xs">VIP</Badge>}
              <span className="font-bold text-popo-pink">{msg.user}:</span>
              <span className="font-normal text-white">{msg.text}</span>
            </div>
          ))}
        </div>

        {/* Action Tray */}
        <div className="flex items-center gap-2">
          {/* Chat input trigger */}
          <div className="flex-1 bg-black/50 backdrop-blur-md hover:bg-black/60 rounded-full px-3.5 py-2 border border-white/10 flex items-center justify-between text-xs text-popo-text-muted cursor-pointer">
            <span>Say something nice...</span>
            <Send className="w-3.5 h-3.5 text-popo-text-secondary" />
          </div>

          {/* PK Challenge Button */}
          <IconButton
            variant="glass"
            size="md"
            className="bg-blue-600/40 border-blue-400/30 hover:bg-blue-600/60 text-white"
            aria-label="PK Battle"
          >
            <Swords className="w-4 h-4 text-cyan-300" />
          </IconButton>

          {/* Share */}
          <IconButton variant="glass" size="md" aria-label="Share">
            <Share2 className="w-4 h-4 text-white" />
          </IconButton>

          {/* Gift Box (Primary action) */}
          <button
            type="button"
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 via-popo-pink to-[#FF5E3A] flex items-center justify-center text-white shadow-glow-pink active:scale-95 transition-transform"
            aria-label="Send Gift"
          >
            <Gift className="w-5 h-5 fill-white animate-bounce" />
          </button>
        </div>
      </div>
    </div>
  );
};
