import React from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  variant?: 'pills' | 'underline' | 'chips';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeId,
  onChange,
  variant = 'pills',
  className,
}) => {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1',
        variant === 'underline' && 'border-b border-white/10 gap-6',
        className
      )}
    >
      {items.map((tab) => {
        const isActive = activeId === tab.id;

        if (variant === 'underline') {
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                'relative pb-2.5 text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap',
                isActive
                  ? 'text-white'
                  : 'text-popo-text-secondary hover:text-white'
              )}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                    isActive ? 'bg-popo-pink text-white' : 'bg-white/10 text-popo-text-secondary'
                  )}
                >
                  {tab.badge}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-popo-pink to-[#FF5E3A] rounded-full shadow-glow-pink" />
              )}
            </button>
          );
        }

        if (variant === 'chips') {
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                'text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap transition-all duration-150 flex items-center gap-1.5',
                isActive
                  ? 'bg-popo-pink/20 text-popo-pink border border-popo-pink/40'
                  : 'bg-popo-dark-850 text-popo-text-secondary hover:text-white border border-white/5'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        }

        // Standard Pills
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap select-none active:scale-95',
              isActive
                ? 'bg-gradient-to-r from-popo-pink to-[#FF5E3A] text-white shadow-glow-pink'
                : 'bg-popo-dark-850 hover:bg-popo-dark-800 text-popo-text-secondary hover:text-white border border-white/5'
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="text-[10px] bg-black/30 px-1.5 py-0.2 rounded-full font-bold">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
