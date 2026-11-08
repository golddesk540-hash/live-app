'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Users, Play } from 'lucide-react';

export interface LiveRoomCardProps {
  id: string;
  title: string;
  hostName: string;
  hostAvatar: string;
  coverImage: string;
  viewerCount: number | string;
  category: string;
  country?: string;
  level?: number;
  isPK?: boolean;
  onClick?: () => void;
  className?: string;
}

export const LiveRoomCard: React.FC<LiveRoomCardProps> = ({
  title,
  hostName,
  hostAvatar,
  coverImage,
  viewerCount,
  category,
  country = '🇵🇰',
  level = 15,
  isPK = false,
  onClick,
  className,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-popo-dark-850 border border-white/10 hover:border-popo-pink/50 hover:shadow-card-hover transition-all duration-300 cursor-pointer select-none',
        className
      )}
    >
      {/* Background Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={coverImage}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Gradient Scrims */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/60 pointer-events-none" />

      {/* Top Overlay Bar */}
      <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1.5 z-10">
        {/* Host Pill */}
        <div className="flex items-center gap-1.5 bg-black/45 backdrop-blur-md rounded-full pl-1 pr-2.5 py-0.5 border border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hostAvatar}
            alt={hostName}
            className="w-4 h-4 rounded-full object-cover"
          />
          <span className="text-[11px] font-medium text-white truncate max-w-[80px]">
            {country} {hostName}
          </span>
        </div>

        {/* Live Badge & Viewer Counter */}
        <div className="flex items-center gap-1">
          {isPK && (
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-gradient-to-r from-red-600 to-blue-600 text-white shadow-sm">
              ⚔️ PK
            </span>
          )}
          <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md rounded-full px-2 py-0.5 border border-white/10 text-white text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-popo-live animate-ping" />
            <Users className="w-3 h-3 text-popo-pink ml-0.5" />
            <span>{viewerCount}</span>
          </div>
        </div>
      </div>

      {/* Hover Play Button Overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 pointer-events-none">
        <div className="w-12 h-12 rounded-full bg-popo-pink/90 text-white flex items-center justify-center shadow-glow-pink">
          <Play className="w-6 h-6 fill-white ml-0.5" />
        </div>
      </div>

      {/* Bottom Info Overlay */}
      <div className="absolute bottom-2.5 inset-x-2.5 flex flex-col gap-1.5 z-10">
        <h4 className="text-xs md:text-sm font-semibold text-white line-clamp-1 drop-shadow-md text-left">
          {title}
        </h4>
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] font-semibold bg-white/15 backdrop-blur-md text-popo-text-primary px-2 py-0.5 rounded-full border border-white/10">
            {category}
          </span>
          <Badge variant="level" level={level} size="xs" />
        </div>
      </div>
    </div>
  );
};
