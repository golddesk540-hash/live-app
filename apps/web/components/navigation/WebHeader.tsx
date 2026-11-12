'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { SearchBar } from '@/components/ui/SearchBar';
import { useUnreadNotificationsCount } from '@/components/notifications/useUnreadNotificationsCount';
import { Video, Coins, Globe, Bell } from 'lucide-react';

export interface WebHeaderProps {
  currentLanguage?: 'en' | 'ur';
  onToggleLanguage?: () => void;
  coins?: number;
  className?: string;
}

export const WebHeader: React.FC<WebHeaderProps> = ({
  currentLanguage = 'en',
  onToggleLanguage,
  coins = 12500,
  className,
}) => {
  const unreadNotifications = useUnreadNotificationsCount();

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full bg-popo-dark-900/90 backdrop-blur-xl border-b border-white/10 px-4 md:px-8 py-3.5',
        className
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-popo-pink via-purple-600 to-popo-cyan p-[2px] shadow-glow-pink">
            <div className="w-full h-full bg-popo-dark-950 rounded-[14px] flex items-center justify-center font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-popo-pink to-amber-400">
              P
            </div>
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1">
              POPO <span className="text-popo-pink">LIVE</span>
            </span>
          </div>
        </div>

        {/* Global Search Bar (Tablet / Desktop) */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <SearchBar placeholder="Search streamers, party rooms, ID..." />
        </div>

        {/* Actions & Profile */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Language Toggle */}
          <button
            type="button"
            onClick={onToggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-popo-dark-800 hover:bg-popo-dark-700 text-xs font-semibold text-popo-text-secondary hover:text-white border border-white/5 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-popo-cyan" />
            <span>{currentLanguage === 'en' ? 'اردو' : 'English'}</span>
          </button>

          {/* Wallet Coin Balance */}
          <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-popo-gold text-xs font-bold shadow-sm">
            <Coins className="w-3.5 h-3.5 fill-popo-gold" />
            <span>{coins.toLocaleString()}</span>
          </div>

          {/* Notifications */}
          <Link
            href="/notifications"
            data-testid="web-header-notifications-link"
            aria-label="Notifications"
            className="relative p-2 rounded-full bg-popo-dark-800 hover:bg-popo-dark-700 text-popo-text-secondary hover:text-white border border-white/5 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications > 0 && (
              <span
                data-testid="shared-nav-notifications-badge"
                className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#FF1A6C] text-white text-[9px] font-black flex items-center justify-center border border-[#120624]"
              >
                {unreadNotifications}
              </span>
            )}
          </Link>

          {/* Go Live Button */}
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Video className="w-3.5 h-3.5" />}
            className="hidden sm:inline-flex"
          >
            Go Live
          </Button>

          {/* User Profile Avatar */}
          <Avatar
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
            size="sm"
            ring="vip"
            isVIP={true}
            status="online"
          />
        </div>
      </div>
    </header>
  );
};
