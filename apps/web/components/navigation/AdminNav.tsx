'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Radio, ShieldAlert, Users, DollarSign, Settings, Lock } from 'lucide-react';

export interface AdminNavProps {
  activeTab?: string;
  onSelectTab?: (id: string) => void;
  className?: string;
}

export const AdminNav: React.FC<AdminNavProps> = ({
  activeTab = 'dashboard',
  onSelectTab,
  className,
}) => {
  const sections = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'monitor', label: 'Live Monitor Wall', icon: Radio, count: '14 Active' },
    { id: 'safety', label: 'Report Queue', icon: ShieldAlert, badge: '5 New' },
    { id: 'users', label: 'Users & Creators', icon: Users },
    { id: 'finance', label: 'Payouts & Ledger', icon: DollarSign },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <aside
      className={cn(
        'w-64 bg-popo-dark-950 border-r border-white/10 p-4 flex flex-col gap-6 min-h-screen text-left',
        className
      )}
    >
      <div className="flex items-center gap-2.5 px-3 py-2">
        <div className="w-8 h-8 rounded-lg bg-popo-pink/20 border border-popo-pink/40 flex items-center justify-center text-popo-pink">
          <Lock className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">Popo Admin</h4>
          <span className="text-[10px] text-popo-text-muted">Master Console v1.0</span>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {sections.map((sec) => {
          const isActive = activeTab === sec.id;
          const Icon = sec.icon;

          return (
            <button
              key={sec.id}
              onClick={() => onSelectTab && onSelectTab(sec.id)}
              className={cn(
                'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors',
                isActive
                  ? 'bg-popo-pink text-white font-bold shadow-glow-pink'
                  : 'text-popo-text-secondary hover:text-white hover:bg-popo-dark-850'
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{sec.label}</span>
              </div>
              {sec.badge && (
                <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                  {sec.badge}
                </span>
              )}
              {sec.count && (
                <span className="text-[10px] text-popo-cyan">{sec.count}</span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
