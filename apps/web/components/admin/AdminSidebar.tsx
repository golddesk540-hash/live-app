'use client';

import React from 'react';
import Link from 'next/link';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Coins,
  FileSpreadsheet,
  History,
  KeyRound,
  Layers,
  LayoutDashboard,
  Radio,
  Settings,
  Shield,
  ShieldAlert,
  UserCheck,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { AdminNavSection } from './types';

interface NavItem {
  id: AdminNavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeColor?: string;
  isPhase10Submodule?: string;
}

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'admins', label: 'Admins', icon: UserCog, badge: '10' },
  { id: 'roles', label: 'Roles', icon: Shield, badge: '6' },
  { id: 'permissions', label: 'Permissions', icon: KeyRound },
  { id: 'activity', label: 'Activity Log', icon: History },
  { id: 'users', label: 'Users', icon: Users, badge: '28' },
  { id: 'hosts', label: 'Hosts', icon: UserCheck, badge: '22', badgeColor: 'bg-purple-500/20 text-purple-300' },
  { id: 'live_monitor', label: 'Live Monitor', icon: Radio, badge: '1,264', badgeColor: 'bg-pink-500/20 text-pink-300' },
  { id: 'reports', label: 'Reports', icon: ShieldAlert, badge: '56', badgeColor: 'bg-amber-500/20 text-amber-300', isPhase10Submodule: '10.4' },
  { id: 'safety', label: 'Safety', icon: Shield, isPhase10Submodule: '10.5' },
  { id: 'economy', label: 'Economy', icon: Coins, isPhase10Submodule: '10.6' },
  { id: 'agency', label: 'Agency', icon: Building2, isPhase10Submodule: '10.7' },
  { id: 'content', label: 'Content', icon: Layers, isPhase10Submodule: '10.8' },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface AdminSidebarProps {
  currentSection: AdminNavSection;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSelectSection: (section: AdminNavSection) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentSection,
  collapsed,
  onToggleCollapse,
  onSelectSection,
  mobileOpen,
  onCloseMobile,
}) => {
  const content = (
    <div className="flex flex-col h-full bg-[#120726]/95 border-r border-purple-500/20 backdrop-blur-xl">
      {/* Sidebar Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
        <div className={`flex items-center gap-2.5 overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF0F7B] to-[#7928CA] flex items-center justify-center shadow-lg shadow-pink-500/25 shrink-0">
            <span className="font-extrabold text-white text-xs tracking-tighter">PL</span>
          </div>
          <div className="leading-tight">
            <span className="text-sm font-extrabold text-white tracking-tight">Popo Live</span>
            <span className="text-[10px] font-bold text-pink-400 block tracking-widest uppercase">Admin</span>
          </div>
        </div>

        {/* Desktop collapse toggle */}
        <button
          type="button"
          data-testid="admin-sidebar-collapse-btn"
          onClick={onToggleCollapse}
          className="hidden md:flex w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 items-center justify-center text-purple-200 transition cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Mobile close button */}
        <button
          type="button"
          data-testid="admin-sidebar-mobile-close"
          onClick={onCloseMobile}
          className="md:hidden w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto no-scrollbar py-3 px-2 space-y-1">
        <div className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-300/60 ${collapsed ? 'text-center' : ''}`}>
          {collapsed ? '•••' : 'Navigation'}
        </div>

        {ADMIN_NAV_ITEMS.map((item) => {
          const active = currentSection === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              data-testid={`admin-nav-${item.id}`}
              onClick={() => {
                onSelectSection(item.id);
                onCloseMobile();
              }}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer group relative ${
                active
                  ? 'bg-gradient-to-r from-[#FF0F7B]/25 via-purple-600/30 to-transparent border border-pink-500/50 text-white shadow-lg shadow-pink-500/10'
                  : 'text-purple-200/75 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-[#FF0F7B]" />
              )}
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                  active ? 'text-[#FF2E93]' : 'text-purple-300'
                }`}
              />
              <span className={`truncate text-left flex-1 ${collapsed ? 'hidden' : 'block'}`}>
                {item.label}
              </span>

              {item.isPhase10Submodule && !collapsed && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/5 text-purple-300 font-mono">
                  {item.isPhase10Submodule}
                </span>
              )}

              {item.badge && !collapsed && (
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-white/10 ${
                    item.badgeColor || 'bg-white/10 text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-white/10 space-y-2">
        <Link
          href="/live"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-purple-200 hover:text-white hover:bg-white/5 transition ${
            collapsed ? 'justify-center' : ''
          }`}
          title="Exit to Popo Live"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className={collapsed ? 'hidden' : 'block'}>Exit to App</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        data-testid="admin-sidebar-desktop"
        className={`hidden md:block shrink-0 transition-all duration-300 z-20 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className="sticky top-0 h-screen">{content}</div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          data-testid="admin-sidebar-mobile-overlay"
          className="md:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex"
          onClick={onCloseMobile}
        >
          <div
            className="w-72 h-full max-w-[80vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {content}
          </div>
        </div>
      )}
    </>
  );
};
