'use client';

import React, { useMemo } from 'react';
import { UserProfileRecord } from './userHostTypes';

interface UserManagementDashboardProps {
  users: UserProfileRecord[];
  onNavigateToAllUsers: () => void;
  onFilterByStatus: (status: string) => void;
  onViewUserDetails: (user: UserProfileRecord) => void;
}

export const UserManagementDashboard: React.FC<UserManagementDashboardProps> = ({
  users,
  onNavigateToAllUsers,
  onFilterByStatus,
  onViewUserDetails,
}) => {
  // Compute exact metrics matching underlying mock user records
  const stats = useMemo(() => {
    let active = 0;
    let inactive = 0;
    let suspended = 0;
    let pending = 0;
    let verified = 0;
    let newUsers = 0;

    users.forEach((u) => {
      if (u.status === 'Active') active++;
      if (u.status === 'Inactive') inactive++;
      if (u.status === 'Suspended') suspended++;
      if (u.status === 'Pending') pending++;
      if (u.verificationStatus === 'Verified') verified++;
      if (u.registrationDate.startsWith('2026')) newUsers++;
    });

    return {
      total: users.length,
      active,
      inactive,
      suspended,
      pending,
      verified,
      newUsers,
    };
  }, [users]);

  // Recent user registrations (latest 4)
  const recentUsers = useMemo(() => {
    return [...users]
      .sort((a, b) => b.registrationDate.localeCompare(a.registrationDate))
      .slice(0, 5);
  }, [users]);

  // Recent user activities collected from all users
  const recentActivities = useMemo(() => {
    const list: Array<{
      id: string;
      userName: string;
      userAvatar: string;
      userId: string;
      action: string;
      details: string;
      timestamp: string;
    }> = [];

    users.forEach((u) => {
      u.activityHistory.forEach((act) => {
        list.push({
          id: act.id,
          userName: u.username,
          userAvatar: u.avatar,
          userId: u.id,
          action: act.action,
          details: act.details,
          timestamp: act.timestamp,
        });
      });
    });

    return list.slice(0, 5);
  }, [users]);

  return (
    <div className="space-y-6" id="user-management-dashboard">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_10px_#FF0F7B]" />
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">
              User Management
            </h2>
          </div>
          <p className="text-xs md:text-sm text-zinc-400 mt-1">
            Global directory analytics, standing verifications, and user lifecycle monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onNavigateToAllUsers}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold text-xs shadow-[0_0_15px_rgba(255,15,123,0.3)] transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>View All {stats.total} Users</span>
          </button>
        </div>
      </div>

      {/* 6 Key Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Users */}
        <div
          onClick={onNavigateToAllUsers}
          className="p-4 rounded-3xl bg-[#160A2D]/85 border border-purple-500/25 hover:border-pink-500/50 cursor-pointer backdrop-blur-md transition-all group"
        >
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            Total Users
          </div>
          <div className="text-2xl font-extrabold text-white group-hover:text-pink-400 transition-colors">
            {stats.total}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">100% Mock Records</div>
        </div>

        {/* Active Users */}
        <div
          onClick={() => onFilterByStatus('Active')}
          className="p-4 rounded-3xl bg-[#160A2D]/85 border border-emerald-500/25 hover:border-emerald-500/50 cursor-pointer backdrop-blur-md transition-all group"
        >
          <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
            Active Users
          </div>
          <div className="text-2xl font-extrabold text-emerald-300">
            {stats.active}
          </div>
          <div className="text-[10px] text-emerald-400/70 mt-1">
            {Math.round((stats.active / stats.total) * 100)}% of total
          </div>
        </div>

        {/* Suspended Users */}
        <div
          onClick={() => onFilterByStatus('Suspended')}
          className="p-4 rounded-3xl bg-[#160A2D]/85 border border-rose-500/25 hover:border-rose-500/50 cursor-pointer backdrop-blur-md transition-all group"
        >
          <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1">
            Suspended
          </div>
          <div className="text-2xl font-extrabold text-rose-300">
            {stats.suspended}
          </div>
          <div className="text-[10px] text-rose-400/70 mt-1">Guideline holds</div>
        </div>

        {/* Pending Users */}
        <div
          onClick={() => onFilterByStatus('Pending')}
          className="p-4 rounded-3xl bg-[#160A2D]/85 border border-amber-500/25 hover:border-amber-500/50 cursor-pointer backdrop-blur-md transition-all group"
        >
          <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
            Pending
          </div>
          <div className="text-2xl font-extrabold text-amber-300">
            {stats.pending}
          </div>
          <div className="text-[10px] text-amber-400/70 mt-1">Verification queue</div>
        </div>

        {/* Inactive Users */}
        <div
          onClick={() => onFilterByStatus('Inactive')}
          className="p-4 rounded-3xl bg-[#160A2D]/85 border border-zinc-500/25 hover:border-zinc-500/50 cursor-pointer backdrop-blur-md transition-all group"
        >
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            Inactive
          </div>
          <div className="text-2xl font-extrabold text-zinc-300">
            {stats.inactive}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">Dormant accounts</div>
        </div>

        {/* Verified Users */}
        <div
          onClick={onNavigateToAllUsers}
          className="p-4 rounded-3xl bg-[#160A2D]/85 border border-purple-500/25 hover:border-purple-400 cursor-pointer backdrop-blur-md transition-all group"
        >
          <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wider mb-1">
            Verified IDs
          </div>
          <div className="text-2xl font-extrabold text-purple-200">
            {stats.verified}
          </div>
          <div className="text-[10px] text-purple-400/70 mt-1">{stats.newUsers} in 2026</div>
        </div>
      </div>

      {/* Two Columns: Recent Registrations & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Recent Registrations */}
        <div className="lg:col-span-7 p-5 rounded-3xl bg-[#160A2D]/80 border border-purple-500/20 backdrop-blur-md shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pink-400" />
              <span>Recent User Registrations</span>
            </h3>
            <button
              onClick={onNavigateToAllUsers}
              className="text-xs text-pink-400 hover:text-pink-300 font-semibold"
            >
              View All ↗
            </button>
          </div>

          <div className="space-y-3">
            {recentUsers.map((user) => (
              <div
                key={user.id}
                className="p-3.5 rounded-2xl bg-[#0E061E]/80 border border-purple-500/15 flex items-center justify-between gap-3 hover:border-pink-500/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-10 h-10 rounded-2xl object-cover border border-purple-500/30"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{user.username}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                        {user.id}
                      </span>
                      {user.verificationStatus === 'Verified' && (
                        <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">
                      {user.email} • {user.country}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${
                      user.status === 'Active'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : user.status === 'Suspended'
                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        : user.status === 'Pending'
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    {user.status}
                  </span>
                  <button
                    onClick={() => onViewUserDetails(user)}
                    className="px-2.5 py-1 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-semibold border border-purple-500/25 transition-colors"
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 5 cols: User Activity Summary */}
        <div className="lg:col-span-5 p-5 rounded-3xl bg-[#160A2D]/80 border border-purple-500/20 backdrop-blur-md shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span>User Activity Summary</span>
            </h3>
            <span className="text-[11px] text-zinc-400">Live feed</span>
          </div>

          <div className="space-y-3">
            {recentActivities.map((act) => (
              <div
                key={act.id}
                className="p-3.5 rounded-2xl bg-[#0E061E]/80 border border-purple-500/15 space-y-1 hover:border-purple-500/30 transition-colors"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <img
                      src={act.userAvatar}
                      alt={act.userName}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span>{act.userName}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">{act.timestamp}</span>
                </div>
                <div className="text-xs font-semibold text-pink-300">{act.action}</div>
                <div className="text-[11px] text-zinc-400 leading-snug">{act.details}</div>
              </div>
            ))}
            {recentActivities.length === 0 && (
              <div className="text-xs text-zinc-500 italic py-6 text-center">
                No recent user activity events logged.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
