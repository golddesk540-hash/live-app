'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Smartphone,
  Radio,
  Users,
  Heart,
  MessageSquare,
  User,
  Download,
  HelpCircle,
  Shield,
  FileText,
  Sparkles,
} from 'lucide-react';
import { DesignFixtures } from '@/lib/design/designFixtures';

export type NavRailId = 'app' | 'live' | 'party' | 'following' | 'message' | 'profile';

export interface WebLeftRailProps {
  activeNav?: NavRailId | string;
  onSelectNav?: (navId: NavRailId) => void;
  onOpenAppModal?: () => void;
  unreadCount?: number;
  isUr?: boolean;
  className?: string;
}

export const WebLeftRail: React.FC<WebLeftRailProps> = ({
  activeNav,
  onSelectNav,
  onOpenAppModal,
  unreadCount,
  isUr = false,
  className = '',
}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Dynamically compute unread message count from fixtures or props
  const effectiveUnreadCount = React.useMemo(() => {
    if (typeof unreadCount === 'number') {
      return unreadCount;
    }
    try {
      return DesignFixtures.totalUnreadMessages;
    } catch {
      return 0;
    }
  }, [unreadCount]);

  // Determine current active navigation item from URL if not explicitly provided
  const currentNav = React.useMemo<NavRailId>(() => {
    if (activeNav) return activeNav as NavRailId;

    if (pathname.includes('/party')) return 'party';
    if (pathname.includes('/inbox')) return 'message';
    if (pathname.includes('/profile')) return 'profile';
    if (pathname.includes('/download')) return 'app';

    const tabParam = searchParams.get('tab');
    if (tabParam === 'following' || pathname.includes('/live/following')) return 'following';

    // Default to 'live' for /live, /near, or root
    return 'live';
  }, [activeNav, pathname, searchParams]);

  // Six Canonical Left Rail Destinations as required by Popo Live v1.1
  const railItems = [
    {
      id: 'app' as NavRailId,
      label_en: 'Get the App',
      label_ur: 'ایپ حاصل کریں',
      icon: Smartphone,
      href: '/download',
      isAppTrigger: true,
      badge: 'FREE',
    },
    {
      id: 'live' as NavRailId,
      label_en: 'Live',
      label_ur: 'لائیو',
      icon: Radio,
      href: '/live',
      badge: 'HOT',
    },
    {
      id: 'party' as NavRailId,
      label_en: 'Party',
      label_ur: 'پارٹی',
      icon: Users,
      href: '/party',
      badge: '9-SEAT',
    },
    {
      id: 'following' as NavRailId,
      label_en: 'Following',
      label_ur: 'فالوئنگ',
      icon: Heart,
      href: '/live?tab=following',
    },
    {
      id: 'message' as NavRailId,
      label_en: 'Message',
      label_ur: 'پیغامات',
      icon: MessageSquare,
      href: '/inbox',
      badge:
        effectiveUnreadCount > 0
          ? effectiveUnreadCount > 99
            ? '99+'
            : String(effectiveUnreadCount)
          : undefined,
    },
    {
      id: 'profile' as NavRailId,
      label_en: 'Profile',
      label_ur: 'پروفائل',
      icon: User,
      href: '/profile',
    },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col justify-between py-5 px-3 md:w-20 lg:w-60 shrink-0 bg-white border-r border-gray-200/80 min-h-[calc(100vh-64px)] transition-all duration-200 select-none ${className}`}
      dir={isUr ? 'rtl' : 'ltr'}
    >
      <div className="space-y-6">
        {/* Rail Title Header on Desktop */}
        <div className="hidden lg:block px-3">
          <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
            {isUr ? 'مین مینو' : 'Main Navigation'}
          </span>
        </div>

        {/* 6 Rail Items */}
        <nav className="space-y-1.5" aria-label="Main Navigation Rail">
          {railItems.map((item) => {
            const isActive = currentNav === item.id;
            const IconComponent = item.icon;

            const handleClick = (e: React.MouseEvent) => {
              if (item.isAppTrigger && onOpenAppModal) {
                e.preventDefault();
                onOpenAppModal();
                return;
              }
              if (onSelectNav) {
                onSelectNav(item.id);
              }
            };

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={handleClick}
                aria-current={isActive ? 'page' : undefined}
                className={`group relative flex items-center md:justify-center lg:justify-between px-3.5 py-3 rounded-2xl text-sm font-bold transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-50 via-rose-50/70 to-pink-50/40 text-[#FF1A6C] border border-pink-200/70 shadow-xs'
                    : 'text-gray-600 hover:text-gray-950 hover:bg-gray-100/70 border border-transparent'
                }`}
              >
                {/* Left: Icon & Label */}
                <div className="flex items-center gap-3.5">
                  <div className="relative shrink-0 flex items-center justify-center">
                    <IconComponent
                      className={`w-5 h-5 transition-transform duration-150 group-hover:scale-110 ${
                        isActive
                          ? 'text-[#FF1A6C]'
                          : 'text-gray-400 group-hover:text-gray-700'
                      }`}
                    />
                    {/* Live pulse dot for Live tab */}
                    {item.id === 'live' && isActive && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#FF1A6C] animate-ping" />
                    )}
                  </div>

                  {/* Label: Shown on Desktop, hidden on Tablet */}
                  <span className="hidden lg:inline tracking-tight text-[13.5px]">
                    {isUr ? item.label_ur : item.label_en}
                  </span>
                </div>

                {/* Right: Badge for HOT, 9-SEAT, or counts */}
                {item.badge && item.badge !== '0' && (
                  <span
                    data-testid={`rail-badge-${item.id}`}
                    className={`hidden lg:inline-flex text-[10px] font-black px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-[#FF1A6C] text-white shadow-xs'
                        : item.badge === 'HOT'
                        ? 'bg-rose-100 text-[#FF1A6C]'
                        : item.badge === '9-SEAT'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Tablet Tooltip on hover */}
                <span className="lg:hidden absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-gray-900 text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-md z-50">
                  {isUr ? item.label_ur : item.label_en}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Promo Card & Secondary Links */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        {/* Get App Card on Desktop */}
        <div className="hidden lg:block p-3.5 rounded-2xl bg-gradient-to-br from-pink-50/60 to-purple-50/40 border border-pink-100 text-left">
          <div className="flex items-center gap-2 text-[#FF1A6C] mb-1">
            <Download className="w-4 h-4" />
            <span className="text-xs font-bold text-gray-900">
              {isUr ? 'موبائل ایپ انسٹال کریں' : 'Install Mobile App'}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed mb-2.5">
            {isUr
              ? 'کیمرے اور ویڈیو کالز کے لیے فون ایپ ضروری ہے'
              : 'Broadcasting & camera seats are hosted on Android & iOS.'}
          </p>
          <button
            type="button"
            onClick={onOpenAppModal}
            className="w-full py-1.5 px-3 rounded-xl bg-[#FF1A6C] hover:bg-[#e0125c] text-white text-xs font-bold transition-colors shadow-xs"
          >
            {isUr ? 'ایپ حاصل کریں' : 'Get the App'}
          </button>
        </div>

        {/* Footer Legal & Help Links (Desktop) */}
        <div className="hidden lg:flex flex-wrap gap-x-3 gap-y-1 px-2 text-[11px] text-gray-400">
          <Link href="/help" className="hover:text-gray-700 transition-colors">
            {isUr ? 'مدد' : 'Help'}
          </Link>
          <span>·</span>
          <Link href="/community-guidelines" className="hover:text-gray-700 transition-colors">
            {isUr ? 'اصول' : 'Rules'}
          </Link>
          <span>·</span>
          <Link href="/policies/terms" className="hover:text-gray-700 transition-colors">
            {isUr ? 'شرائط' : 'Terms'}
          </Link>
          <span>·</span>
          <Link href="/policies/privacy" className="hover:text-gray-700 transition-colors">
            {isUr ? 'پرائیویسی' : 'Privacy'}
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default WebLeftRail;
