'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Tv, Trophy, Briefcase, Bell, Sparkles, Award } from 'lucide-react';

export interface RankDoorItem {
  id: string;
  title: string;
  titleUrdu?: string;
  iconType: string;
  gradient: string;
  destination: string;
  hasNotificationDot?: boolean;
  description?: string;
}

interface RankDoorSectionProps {
  className?: string;
}

export default function RankDoorSection({ className = '' }: RankDoorSectionProps) {
  const router = useRouter();
  const [doors, setDoors] = useState<RankDoorItem[]>([
    {
      id: 'event',
      title: 'Event',
      iconType: 'event',
      gradient: 'from-[#c026d3] to-[#ec4899]',
      destination: '/news',
      hasNotificationDot: true,
    },
    {
      id: 'rank',
      title: 'Rank',
      iconType: 'rank',
      gradient: 'from-[#f59e0b] to-[#ea580c]',
      destination: '/ranking',
      hasNotificationDot: false,
    },
    {
      id: 'agency',
      title: 'Agency',
      iconType: 'agency',
      gradient: 'from-[#0ea5e9] to-[#2563eb]',
      destination: '/agency',
      hasNotificationDot: false,
    },
    {
      id: 'notice',
      title: 'Notice',
      iconType: 'notice',
      gradient: 'from-[#ec4899] to-[#f43f5e]',
      destination: '/news',
      hasNotificationDot: false,
    },
  ]);

  // Fetch from backend API
  useEffect(() => {
    let isMounted = true;
    async function loadDoors() {
      try {
        const res = await fetch('/api/discovery/rank-doors');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && Array.isArray(data.doors)) {
            setDoors(data.doors);
          }
        }
      } catch (err) {
        console.error('Failed to load rank doors:', err);
      }
    }
    loadDoors();
    return () => { isMounted = false; };
  }, []);

  const renderIcon = (type: string) => {
    switch (type) {
      case 'event':
        return <Tv className="w-5 h-5 sm:w-6 sm:h-6 text-white stroke-[2.2]" />;
      case 'rank':
        return <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white stroke-[2.2]" />;
      case 'agency':
        return <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-white stroke-[2.2]" />;
      case 'notice':
      default:
        return <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-white stroke-[2.2]" />;
    }
  };

  return (
    <div
      className={`w-full grid grid-cols-4 gap-2.5 sm:gap-4 md:gap-6 py-2 select-none ${className}`}
      data-testid="rank-door-section"
    >
      {doors.map((door) => (
        <Link
          key={door.id}
          href={door.destination}
          className="group flex flex-col items-center gap-1.5 focus:outline-none"
        >
          {/* SQUIRCLE ICON BUTTON (Matching 03_05 reference 1:1) */}
          <div className="relative">
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl sm:rounded-3xl bg-gradient-to-br ${door.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 active:scale-95 transition-all duration-200 border border-white/20`}
            >
              {renderIcon(door.iconType)}
            </div>

            {/* Notification alert dot if present */}
            {door.hasNotificationDot && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 ring-2 ring-[#0c0e1e] animate-pulse" />
            )}
          </div>

          {/* LABEL TEXT */}
          <span className="text-[11px] sm:text-xs md:text-sm font-bold text-white/90 group-hover:text-white transition-colors tracking-tight">
            {door.title}
          </span>
        </Link>
      ))}
    </div>
  );
}
