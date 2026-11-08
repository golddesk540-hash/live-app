'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Radio, Users, Compass, MessageCircle, User } from 'lucide-react';

export interface MobileNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  isCenter?: boolean;
}

export interface MobileNavigationProps {
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeId,
  onChange,
  className,
}) => {
  const navItems: MobileNavItem[] = [
    { id: 'live', label: 'Live', icon: Radio },
    { id: 'party', label: 'Party', icon: Users },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'messages', label: 'Square', icon: MessageCircle, badge: 3 },
    { id: 'profile', label: 'Me', icon: User },
  ];

  return (
    <nav
      className={cn(
        'fixed bottom-0 inset-x-0 z-40 bg-popo-dark-900/95 backdrop-blur-xl border-t border-white/10 px-3 py-2 pb-safe max-w-md mx-auto',
        className
      )}
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = activeId === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className="relative flex flex-col items-center justify-center py-1 px-3 min-w-[56px] transition-all duration-150 active:scale-90"
            >
              <div className="relative">
                <Icon
                  className={cn(
                    'w-6 h-6 transition-all duration-200',
                    isActive ? 'text-popo-pink scale-110 drop-shadow-sm' : 'text-popo-text-secondary'
                  )}
                />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 bg-popo-live text-white text-[10px] font-extrabold px-1 rounded-full border border-popo-dark-900">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'text-[11px] font-semibold mt-1 transition-colors',
                  isActive ? 'text-popo-pink font-bold' : 'text-popo-text-secondary'
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-popo-pink shadow-glow-pink mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
