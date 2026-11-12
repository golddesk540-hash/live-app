'use client';

import React from 'react';
import Link from 'next/link';
import { useUnreadNotificationsCount } from '@/components/notifications/useUnreadNotificationsCount';
import {
  ArrowLeft,
  Bell,
  Compass,
  Crown,
  Flame,
  Home,
  MessageCircle,
  PlusSquare,
  Sparkles,
  User,
  UserPlus,
} from 'lucide-react';

interface SquareWebNavbarProps {
  activeSection: 'feed' | 'discovery' | 'post';
  rightSlot?: React.ReactNode;
}

export const SquareWebNavbar: React.FC<SquareWebNavbarProps> = ({
  activeSection,
  rightSlot,
}) => {
  const unreadNotifications = useUnreadNotificationsCount();

  const navItems = [
    { href: '/live', label: 'Home', active: false, Icon: Home },
    { href: '/square', label: 'Square Feed', active: activeSection === 'feed', Icon: Flame },
    { href: '/square/discovery', label: 'Discovery', active: activeSection === 'discovery', Icon: Compass },
    { href: '/square/create', label: 'Create', active: false, Icon: PlusSquare },
    { href: '/fan-club', label: 'Fan Club', active: false, Icon: Crown },
    { href: '/inbox', label: 'Messages', active: false, Icon: MessageCircle },
    { href: '/invites', label: 'Invites', active: false, Icon: UserPlus },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-purple-400/20 bg-[#120624]/95 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand Left */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href={activeSection === 'feed' ? '/live' : '/square'}
            aria-label="Back"
            className="p-2 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-purple-100/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <Link href="/live" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF1A6C] to-[#9333EA] flex items-center justify-center shadow-glow-pink">
              <span className="font-black text-white text-sm tracking-tight">P</span>
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm tracking-tight text-white">Popo Live</span>
                <span className="px-1.5 py-0.5 rounded-md bg-[#FF1A6C]/20 border border-[#FF1A6C]/40 text-[9px] font-extrabold text-[#FF4D8D] uppercase tracking-wider">
                  Web Square
                </span>
              </div>
              <p className="text-[10px] text-purple-200/60 hidden sm:block">Community &amp; Discovery</p>
            </div>
          </Link>
        </div>

        {/* Center Desktop Web Navigation */}
        <nav aria-label="Square Web Navigation" className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.Icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  item.active
                    ? 'bg-gradient-to-r from-[#FF1A6C] to-[#EC4899] text-white shadow-glow-pink'
                    : 'text-purple-200/75 hover:text-white hover:bg-[#1E0E3D]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {rightSlot}

          <Link
            href="/notifications"
            data-testid="web-square-notifications-link"
            aria-label="Notifications"
            className="relative p-2 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-purple-100/85 transition-colors"
          >
            <Bell className="w-4 h-4 text-[#FF6BA3]" />
            {unreadNotifications > 0 && (
              <span
                data-testid="web-square-notifications-badge"
                className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#FF1A6C] text-white text-[9px] font-black flex items-center justify-center border border-[#120624]"
              >
                {unreadNotifications}
              </span>
            )}
          </Link>

          <Link
            href="/profile"
            aria-label="My Profile"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-xs font-bold text-purple-100 transition-colors"
          >
            <User className="w-3.5 h-3.5 text-[#FF4D8D]" />
            <span>Profile</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export const SquareWebFooter: React.FC = () => {
  return (
    <footer className="mt-10 border-t border-purple-400/15 bg-[#0A0216]/95 py-6 px-4 text-xs text-purple-200/60">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#FF4D8D]" />
          <span className="font-bold text-purple-100/85">Popo Live Square Web</span>
          <span className="text-purple-200/45">•</span>
          <span>1-to-1 Video Call remains OFF by default</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 font-semibold">
          <Link href="/live" className="hover:text-white transition-colors">Home</Link>
          <Link href="/square" className="hover:text-white transition-colors">Square</Link>
          <Link href="/square/discovery" className="hover:text-white transition-colors">Discovery</Link>
          <Link href="/inbox" className="hover:text-white transition-colors">Messages</Link>
          <Link href="/fan-club" className="hover:text-white transition-colors">Fan Club</Link>
          <Link href="/invites" className="hover:text-white transition-colors">Invites</Link>
          <Link href="/profile" className="hover:text-white transition-colors">Profile</Link>
        </div>
      </div>
    </footer>
  );
};
