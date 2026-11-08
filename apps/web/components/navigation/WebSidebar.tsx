'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Compass, Radio, Users, Swords, Trophy, Flame, Smartphone } from 'lucide-react';

export interface WebSidebarProps {
  activeSection?: string;
  onSelectSection?: (id: string) => void;
  className?: string;
}

export const WebSidebar: React.FC<WebSidebarProps> = ({
  activeSection = 'explore',
  onSelectSection,
  className,
}) => {
  const mainNav = [
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'live', label: 'Live Streams', icon: Radio, count: '1.2k' },
    { id: 'party', label: 'Party Rooms', icon: Users, count: '480' },
    { id: 'pk', label: 'PK Battles', icon: Swords, badge: 'HOT' },
    { id: 'rankings', label: 'Rankings', icon: Trophy },
  ];

  const topStreamers = [
    {
      id: '1',
      name: 'Ayesha Khan',
      viewers: '2.4k',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      category: 'Singing',
      level: 42,
    },
    {
      id: '2',
      name: 'Zaid Star',
      viewers: '1.8k',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      category: 'PK King',
      level: 65,
    },
    {
      id: '3',
      name: 'Sara Voice',
      viewers: '920',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
      category: '9-Seat Chat',
      level: 28,
    },
  ];

  return (
    <aside
      className={cn(
        'w-64 shrink-0 hidden lg:flex flex-col bg-popo-dark-900 border-r border-white/10 p-4 gap-6 min-h-[calc(100vh-65px)]',
        className
      )}
    >
      {/* Primary Discovery Navigation */}
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-popo-text-muted px-3 mb-1">
          Feeds
        </span>
        {mainNav.map((item) => {
          const isActive = activeSection === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onSelectSection && onSelectSection(item.id)}
              className={cn(
                'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150',
                isActive
                  ? 'bg-popo-pink text-white shadow-glow-pink'
                  : 'text-popo-text-secondary hover:text-white hover:bg-popo-dark-800'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] bg-red-500/20 text-red-400 font-extrabold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <Flame className="w-2.5 h-2.5 fill-red-400" />
                  {item.badge}
                </span>
              )}
              {item.count && (
                <span className="text-xs text-popo-text-muted">{item.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Top Streamers Followed */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-popo-text-muted px-3">
          Top Live Creators
        </span>
        <div className="flex flex-col gap-1">
          {topStreamers.map((streamer) => (
            <div
              key={streamer.id}
              className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-popo-dark-800 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5 truncate">
                <Avatar src={streamer.avatar} size="sm" ring="live" status="live" />
                <div className="flex flex-col truncate">
                  <span className="text-xs font-semibold text-white truncate">{streamer.name}</span>
                  <span className="text-[10px] text-popo-text-muted">{streamer.category}</span>
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <Badge variant="level" level={streamer.level} size="xs" />
                <span className="text-[10px] text-popo-pink font-bold mt-1">🔴 {streamer.viewers}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Download Mobile App Promo Widget */}
      <div className="mt-auto p-4 rounded-2xl bg-gradient-to-br from-popo-dark-850 to-popo-dark-800 border border-white/10 text-left">
        <div className="flex items-center gap-2.5 text-popo-pink mb-2">
          <Smartphone className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider text-white">Get Mobile App</span>
        </div>
        <p className="text-xs text-popo-text-secondary mb-3 leading-relaxed">
          Watch streams on the go, earn coin rewards, and join voice parties on Android & iOS.
        </p>
        <div className="flex gap-2">
          <button className="flex-1 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold py-2 rounded-lg transition-colors">
            Google Play
          </button>
          <button className="flex-1 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold py-2 rounded-lg transition-colors">
            App Store
          </button>
        </div>
      </div>
    </aside>
  );
};
