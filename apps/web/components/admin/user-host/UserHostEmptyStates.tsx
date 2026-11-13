'use client';

import React from 'react';

export type UserHostEmptyKind =
  | 'no_users'
  | 'no_hosts'
  | 'no_search_results'
  | 'no_users_status'
  | 'no_hosts_status'
  | 'no_user_activity'
  | 'no_host_activity'
  | 'no_selected';

interface UserHostEmptyStateProps {
  kind: UserHostEmptyKind;
  onReset?: () => void;
  customMessage?: string;
}

export const UserHostEmptyStates: React.FC<UserHostEmptyStateProps> = ({
  kind,
  onReset,
  customMessage,
}) => {
  const config = {
    no_users: {
      title: 'No Registered Users',
      message: 'There are currently no platform user records loaded in this view.',
      icon: (
        <svg className="w-8 h-8 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    no_hosts: {
      title: 'No Registered Hosts',
      message: 'No verified or onboarding creator records match the criteria.',
      icon: (
        <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
        </svg>
      ),
    },
    no_search_results: {
      title: 'No Matching Records Found',
      message: 'No user or host entries matched your search query or applied filters.',
      icon: (
        <svg className="w-8 h-8 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    no_users_status: {
      title: 'No Users in Selected Status',
      message: 'No user accounts currently hold this status filter classification.',
      icon: (
        <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    no_hosts_status: {
      title: 'No Hosts in Selected Status',
      message: 'No creator profiles match the chosen host standing category.',
      icon: (
        <svg className="w-8 h-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    no_user_activity: {
      title: 'No User Activity Logged',
      message: 'No platform activity events recorded for this user profile yet.',
      icon: (
        <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    no_host_activity: {
      title: 'No Broadcast Activity',
      message: 'This creator has not initiated live streaming sessions or daily tasks recently.',
      icon: (
        <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
    },
    no_selected: {
      title: 'No Records Selected',
      message: 'Select individual user or host items using the checkboxes to perform bulk actions.',
      icon: (
        <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
  }[kind];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-3xl bg-[#160A2D]/60 border border-purple-500/20 backdrop-blur-md">
      <div className="w-16 h-16 rounded-3xl bg-[#0E061E] border border-purple-500/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(255,15,123,0.15)]">
        {config.icon}
      </div>
      <h3 className="text-base font-bold text-white mb-1.5">{config.title}</h3>
      <p className="text-xs text-zinc-400 max-w-sm mb-5 leading-relaxed">
        {customMessage || config.message}
      </p>
      {onReset && (
        <button
          onClick={onReset}
          className="px-4 py-2 rounded-2xl bg-[#0E061E] hover:bg-purple-950/40 text-pink-300 border border-purple-500/30 text-xs font-semibold shadow-md transition-all active:scale-95"
        >
          Reset Filters & Search
        </button>
      )}
    </div>
  );
};
