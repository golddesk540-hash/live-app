'use client';

import React from 'react';
import {
  FileText,
  Newspaper,
  Radio,
  ShieldAlert,
  Sparkles,
  UserCheck,
  UserCog,
  Users,
} from 'lucide-react';
import { AdminNavSection } from './types';

interface QuickActionItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  targetSection: AdminNavSection;
  badge?: string;
}

const QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: 'user_admin',
    title: 'User Admin',
    subtitle: 'Inspect & manage platform user accounts',
    icon: Users,
    targetSection: 'users',
    badge: '10.2',
  },
  {
    id: 'live_monitor',
    title: 'Live Monitor',
    subtitle: 'Real-time broadcast vitals & stream safety',
    icon: Radio,
    targetSection: 'live_monitor',
    badge: '10.3',
  },
  {
    id: 'reports',
    title: 'Reports',
    subtitle: 'Viewer incident queue & moderation review',
    icon: ShieldAlert,
    targetSection: 'reports',
    badge: '10.4',
  },
  {
    id: 'add_news',
    title: 'Add News',
    subtitle: 'Publish platform notices & announcements',
    icon: Newspaper,
    targetSection: 'content',
    badge: '10.8',
  },
];

interface QuickActionsSectionProps {
  onSelectAction: (section: AdminNavSection, title: string) => void;
}

export const QuickActionsSection: React.FC<QuickActionsSectionProps> = ({ onSelectAction }) => {
  return (
    <div data-testid="admin-quick-actions-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-pink-400" />
          Quick Actions
        </h2>
        <span className="text-xs text-purple-300/75">Direct module access</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {QUICK_ACTIONS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              data-testid={`quick-action-${item.id}`}
              onClick={() => onSelectAction(item.targetSection, item.title)}
              className="text-center rounded-3xl bg-[#160A2D]/95 hover:bg-[#200E40] border border-purple-500/25 hover:border-pink-400/50 p-4 transition-all duration-200 cursor-pointer shadow-lg group flex flex-col items-center justify-between gap-2.5 active:scale-[0.98]"
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF0F7B]/20 via-[#7928CA]/25 to-transparent border border-pink-500/40 flex items-center justify-center text-pink-400 group-hover:text-white group-hover:scale-110 transition-all shadow-md shadow-pink-500/20">
                  <Icon className="w-6 h-6" />
                </div>
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-pink-500/30 border border-pink-400 text-pink-200">
                    {item.badge}
                  </span>
                )}
              </div>

              <div>
                <p className="text-xs sm:text-sm font-extrabold text-white group-hover:text-pink-300 transition">
                  {item.title}
                </p>
                <p className="text-[10px] text-purple-200/70 line-clamp-1 mt-0.5">
                  {item.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
