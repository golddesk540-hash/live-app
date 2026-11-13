'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Menu,
  MoreVertical,
  RotateCcw,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { AdminProfileData } from './types';

interface AdminHeaderProps {
  profile: AdminProfileData;
  onOpenMobileSidebar: () => void;
  onResetDemo: () => void;
  onOpenProfile: () => void;
  onPreviewEmpty?: (kind: any) => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  profile,
  onOpenMobileSidebar,
  onResetDemo,
  onOpenProfile,
  onPreviewEmpty,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(4);

  return (
    <header
      data-testid="admin-header"
      className="sticky top-0 z-30 h-16 bg-[#130728]/90 backdrop-blur-xl border-b border-purple-500/20 px-4 md:px-6 flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          type="button"
          data-testid="admin-mobile-menu-btn"
          onClick={onOpenMobileSidebar}
          className="md:hidden w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white cursor-pointer"
          title="Open menu"
        >
          <Menu className="w-5 h-5 text-pink-300" />
        </button>

        {/* Popo Live Logo & Title matching 10_01 */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF0F7B] via-[#D946EF] to-[#7928CA] flex items-center justify-center shadow-lg shadow-pink-500/25">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-base md:text-lg font-black tracking-tight text-white">
              Popo Live
            </span>
            <span className="text-xs font-bold text-pink-400 tracking-wider uppercase">
              Admin
            </span>
          </div>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2.5 relative">
        {/* Notifications */}
        <button
          type="button"
          onClick={() => setUnreadCount(0)}
          data-testid="admin-notifications-btn"
          className="relative w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-purple-200 transition cursor-pointer"
          title="Admin notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF0F7B] shadow-sm shadow-pink-500" />
          )}
        </button>

        {/* Admin Profile Identity Button */}
        <button
          type="button"
          data-testid="admin-profile-btn"
          onClick={onOpenProfile}
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-purple-500/30 transition cursor-pointer"
        >
          <Avatar src={profile.avatar} alt={profile.name} size="xs" ring="pink" />
          <div className="text-left hidden sm:block">
            <p className="text-xs font-extrabold text-white leading-tight flex items-center gap-1">
              {profile.name}
              <ShieldCheck className="w-3 h-3 text-pink-400" />
            </p>
            <p className="text-[10px] font-semibold text-pink-300 leading-tight">
              {profile.role}
            </p>
          </div>
        </button>

        {/* Options 3-dot dropdown */}
        <button
          type="button"
          data-testid="admin-options-btn"
          onClick={() => setShowMenu((v) => !v)}
          className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-purple-200 transition cursor-pointer"
          title="More options"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {showMenu && (
          <div
            data-testid="admin-options-dropdown"
            className="absolute right-0 top-12 w-64 rounded-2xl bg-[#1C0D37] border border-purple-400/30 shadow-2xl p-2 z-50 space-y-1 text-xs"
          >
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-300/80">
              Admin Demo Tools
            </div>
            <button
              type="button"
              data-testid="admin-reset-demo-btn"
              onClick={() => {
                onResetDemo();
                setShowMenu(false);
              }}
              className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/10 text-white font-semibold flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-pink-400" />
              Reset Demo Admin Data
            </button>
            <div className="border-t border-white/10 my-1" />
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-300/80">
              Empty State Previews
            </div>
            {(
              [
                ['no_search_results', 'No Search Results'],
                ['no_admins_filtered', 'No Filtered Admins'],
                ['no_roles_filtered', 'No Roles Found'],
                ['no_activity_logged', 'No Activity Logged'],
              ] as const
            ).map(([kind, label]) => (
              <button
                key={kind}
                type="button"
                data-testid={`preview-empty-${kind}`}
                onClick={() => {
                  if (onPreviewEmpty) onPreviewEmpty(kind);
                  setShowMenu(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-purple-200 cursor-pointer"
              >
                {label}
              </button>
            ))}
            <div className="border-t border-white/10 my-1" />
            <Link
              href="/admin/finance"
              className="block px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-purple-200"
            >
              Open Finance Ledger (Phase 7)
            </Link>
            <Link
              href="/admin/gifts"
              className="block px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-purple-200"
            >
              Open Gift Catalog (Phase 7)
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
