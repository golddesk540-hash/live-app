'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Radio,
  Users,
  Heart,
  MessageSquare,
  User,
  Download,
} from 'lucide-react';

export interface WebMobileNavProps {
  activeNav?: string;
  onOpenAppModal?: () => void;
  isUr?: boolean;
  className?: string;
}

export const WebMobileNav: React.FC<WebMobileNavProps> = ({
  activeNav,
  onOpenAppModal,
  isUr = false,
  className = '',
}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Determine current active navigation item from URL
  const currentNav = React.useMemo(() => {
    if (activeNav) return activeNav;

    if (pathname.includes('/party')) return 'party';
    if (pathname.includes('/inbox')) return 'message';
    if (pathname.includes('/profile')) return 'profile';
    if (pathname.includes('/download')) return 'app';

    const tabParam = searchParams.get('tab');
    if (tabParam === 'following' || pathname.includes('/live/following')) return 'following';

    return 'live';
  }, [activeNav, pathname, searchParams]);

  const navItems = [
    {
      id: 'live',
      label_en: 'Live',
      label_ur: 'لائیو',
      icon: Radio,
      href: '/live',
    },
    {
      id: 'party',
      label_en: 'Party',
      label_ur: 'پارٹی',
      icon: Users,
      href: '/party',
    },
    {
      id: 'following',
      label_en: 'Following',
      label_ur: 'فالوئنگ',
      icon: Heart,
      href: '/live?tab=following',
    },
    {
      id: 'message',
      label_en: 'Message',
      label_ur: 'پیغامات',
      icon: MessageSquare,
      href: '/inbox',
    },
    {
      id: 'profile',
      label_en: 'Profile',
      label_ur: 'پروفائل',
      icon: User,
      href: '/profile',
    },
  ];

  return (
    <nav
      className={`fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/80 py-1.5 px-2 flex items-center justify-around shadow-lg md:hidden select-none ${className}`}
      dir={isUr ? 'rtl' : 'ltr'}
      aria-label="Mobile Bottom Navigation"
    >
      {navItems.map((item) => {
        const isActive = currentNav === item.id;
        const IconComponent = item.icon;

        return (
          <Link
            key={item.id}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-colors ${
              isActive
                ? 'text-[#FF1A6C] font-bold'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <div className="relative">
              <IconComponent className="w-5 h-5" />
              {item.id === 'live' && isActive && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#FF1A6C]" />
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">
              {isUr ? item.label_ur : item.label_en}
            </span>
          </Link>
        );
      })}

      {/* Quick Get App Action Trigger */}
      <button
        type="button"
        onClick={onOpenAppModal}
        className="flex flex-col items-center justify-center flex-1 py-1 text-gray-500 hover:text-[#FF1A6C] transition-colors"
        aria-label="Get the App"
      >
        <Download className="w-5 h-5" />
        <span className="text-[10px] tracking-tight mt-0.5">
          {isUr ? 'ایپ' : 'App'}
        </span>
      </button>
    </nav>
  );
};

export default WebMobileNav;
