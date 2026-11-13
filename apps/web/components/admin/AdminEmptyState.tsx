'use client';

import React from 'react';
import { Activity, SearchX, ShieldAlert, Users } from 'lucide-react';
import { AdminEmptyKind } from './types';

interface AdminEmptyStateProps {
  kind: AdminEmptyKind;
  onReset?: () => void;
  resetLabel?: string;
}

const EMPTY_CONFIG: Record<
  AdminEmptyKind,
  {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  no_search_results: {
    title: 'No Matching Records Found',
    description: 'No admin accounts, roles, or activities matched your search criteria.',
    icon: SearchX,
  },
  no_admins_filtered: {
    title: 'No Admins in This Filter',
    description: 'There are currently zero sample admin accounts matching the selected role or status.',
    icon: Users,
  },
  no_roles_filtered: {
    title: 'No Roles Found',
    description: 'No administrative role definitions match your search or filter options.',
    icon: ShieldAlert,
  },
  no_activity_logged: {
    title: 'No Admin Activity Logged',
    description: 'No administrative actions or simulation logs are recorded for this category.',
    icon: Activity,
  },
};

export const AdminEmptyState: React.FC<AdminEmptyStateProps> = ({
  kind,
  onReset,
  resetLabel = 'Reset Filters & Search',
}) => {
  const cfg = EMPTY_CONFIG[kind];
  const Icon = cfg.icon;

  return (
    <div
      data-testid={`admin-empty-${kind}`}
      className="rounded-3xl bg-[#150A28]/90 border border-purple-500/25 p-8 text-center shadow-xl animate-in fade-in duration-200"
    >
      <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-indigo-500/20 border border-pink-400/35 flex items-center justify-center">
        <Icon className="w-7 h-7 text-pink-300" />
      </div>
      <h3 className="text-base font-extrabold text-white mb-1.5">{cfg.title}</h3>
      <p className="text-sm text-purple-200/75 max-w-md mx-auto">{cfg.description}</p>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#FF0F7B] via-[#FF1E8E] to-[#E11D84] hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-pink-500/20 transition cursor-pointer"
        >
          {resetLabel}
        </button>
      )}
    </div>
  );
};
