'use client';

import React from 'react';

export type LiveEmptyKind =
  | 'no_active_sessions'
  | 'no_live_hosts'
  | 'no_viewers'
  | 'no_completed_sessions'
  | 'no_search_results'
  | 'no_activity_history'
  | 'preview_unavailable';

interface LiveMonitorEmptyStateProps {
  kind: LiveEmptyKind;
  onResetFilters?: () => void;
  customMessage?: string;
}

export const LiveMonitorEmptyState: React.FC<LiveMonitorEmptyStateProps> = ({
  kind,
  onResetFilters,
  customMessage,
}) => {
  const configs: Record<
    LiveEmptyKind,
    { title: string; desc: string; iconPath: string; actionLabel?: string }
  > = {
    no_active_sessions: {
      title: 'No Active Live Sessions',
      desc: 'There are currently no active Agora broadcasts running on the platform.',
      iconPath: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
    },
    no_live_hosts: {
      title: 'No Hosts Currently Live',
      desc: 'All registered platform broadcasters are currently idle or offline.',
      iconPath: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    },
    no_viewers: {
      title: 'No Active Viewers in Room',
      desc: 'This broadcast currently has zero viewers connected in this session.',
      iconPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    },
    no_completed_sessions: {
      title: 'No Completed Session Records',
      desc: 'Historical session logs and archived broadcast analytics are empty.',
      iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    no_search_results: {
      title: 'No Matching Live Sessions',
      desc: 'No active streams match your current search criteria or category filter.',
      iconPath: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      actionLabel: 'Clear All Filters',
    },
    no_activity_history: {
      title: 'No Activity Events Recorded',
      desc: 'No join milestones, title updates, or battle events have been logged for this stream.',
      iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    },
    preview_unavailable: {
      title: 'Stream Preview Unavailable',
      desc: 'Demo preview feed is not available for this session (Signal Hold or Private stream).',
      iconPath: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',
    },
  };

  const item = configs[kind];

  return (
    <div
      data-testid={`empty-state-${kind}`}
      className="p-10 rounded-3xl bg-[#160A2D]/70 border border-purple-500/20 text-center flex flex-col items-center justify-center my-4 animate-fadeIn"
    >
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-purple-600/20 border border-pink-500/30 flex items-center justify-center text-pink-400 mb-4 shadow-[0_0_20px_rgba(255,15,123,0.25)]">
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.iconPath} />
        </svg>
      </div>

      <h3 className="text-base font-bold text-white mb-1">{item.title}</h3>
      <p className="text-xs text-zinc-400 max-w-sm mb-4 leading-relaxed">
        {customMessage || item.desc}
      </p>

      {item.actionLabel && onResetFilters && (
        <button
          onClick={onResetFilters}
          className="px-4 py-2 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40 text-xs font-semibold transition-all active:scale-95"
        >
          {item.actionLabel}
        </button>
      )}
    </div>
  );
};
