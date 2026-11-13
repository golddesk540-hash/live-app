'use client';

import React, { useState } from 'react';
import { UserProfileRecord } from './userHostTypes';

interface UserDetailsViewProps {
  user: UserProfileRecord;
  onBack: () => void;
  onChangeStatusClick: (user: UserProfileRecord) => void;
  onEditProfileClick: (user: UserProfileRecord) => void;
}

export const UserDetailsView: React.FC<UserDetailsViewProps> = ({
  user,
  onBack,
  onChangeStatusClick,
  onEditProfileClick,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'activity' | 'history'>('profile');

  return (
    <div className="space-y-6" id="user-details-view">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#0E061E] hover:bg-purple-950/40 text-purple-300 border border-purple-500/25 text-xs font-semibold transition-all active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to All Users</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEditProfileClick(user)}
            className="px-4 py-2 rounded-2xl bg-[#0E061E] hover:bg-purple-900/40 text-pink-300 border border-purple-500/25 text-xs font-semibold transition-all"
          >
            Edit Profile
          </button>
          <button
            onClick={() => onChangeStatusClick(user)}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold text-xs shadow-[0_0_15px_rgba(255,15,123,0.3)] transition-all"
          >
            Manage Status ({user.status})
          </button>
        </div>
      </div>

      {/* Hero User Banner Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#160A2D] via-[#1B0D38] to-[#0E061E] border border-purple-500/30 shadow-2xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start md:items-center gap-5">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.username}
              className="w-20 h-20 rounded-3xl object-cover border-2 border-pink-500/50 shadow-[0_0_20px_rgba(255,15,123,0.3)]"
            />
            {user.isHost && (
              <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-lg bg-pink-500 text-white font-mono font-bold text-[9px] shadow-md">
                HOST
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-white">{user.username}</h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700">
                {user.id}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-xl text-xs font-bold border ${
                  user.status === 'Active'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : user.status === 'Suspended'
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}
              >
                {user.status}
              </span>
            </div>

            <div className="text-xs text-zinc-400 mt-1 flex items-center gap-3 flex-wrap">
              <span>{user.email}</span>
              <span>•</span>
              <span>{user.country}</span>
              <span>•</span>
              <span>Registered {user.registrationDate}</span>
            </div>

            <p className="text-xs text-zinc-300 mt-2 max-w-xl italic">"{user.bio}"</p>
          </div>
        </div>

        {/* Quick Balances */}
        <div className="flex md:flex-col items-center md:items-end justify-between gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-purple-500/20">
          <div className="text-left md:text-right">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
              Wealth Standing
            </div>
            <div className="text-sm font-bold text-pink-400 font-mono">
              Level {user.wealthLevel}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
              Coin Balance
            </div>
            <div className="text-sm font-bold text-amber-300 font-mono">
              {user.coinsBalance.toLocaleString()} coins
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 border-b border-purple-500/20 pb-2">
        {[
          { key: 'profile', label: 'Profile Information' },
          { key: 'account', label: 'Account Information' },
          { key: 'activity', label: `Activity Overview (${user.activityHistory.length})` },
          { key: 'history', label: `Account History (${user.accountAuditLog.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTab === t.key
                ? 'bg-pink-500 text-white shadow-[0_0_12px_rgba(255,15,123,0.35)]'
                : 'text-zinc-400 hover:text-white hover:bg-purple-950/40'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Profile Information */}
      {activeTab === 'profile' && (
        <div className="p-6 rounded-3xl bg-[#160A2D]/80 border border-purple-500/20 backdrop-blur-md space-y-5 animate-fadeIn">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-400" />
            <span>Personal & Public Metadata</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#0E061E]/80 border border-purple-500/15">
              <span className="text-zinc-500 block mb-1">Nickname</span>
              <span className="font-semibold text-white">{user.nickname}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0E061E]/80 border border-purple-500/15">
              <span className="text-zinc-500 block mb-1">Gender</span>
              <span className="font-semibold text-white">{user.gender}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0E061E]/80 border border-purple-500/15">
              <span className="text-zinc-500 block mb-1">Masked Phone</span>
              <span className="font-mono font-semibold text-white">{user.phoneMasked}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0E061E]/80 border border-purple-500/15">
              <span className="text-zinc-500 block mb-1">Country / Territory</span>
              <span className="font-semibold text-white">
                {user.country} ({user.countryCode})
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0E061E]/80 border border-purple-500/15">
              <span className="text-zinc-500 block mb-1">Host Privilege Status</span>
              <span className="font-semibold text-white">
                {user.isHost ? `Verified Creator (Host ID: ${user.linkedHostId})` : 'Standard Listener / Viewer'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0E061E]/80 border border-purple-500/15">
              <span className="text-zinc-500 block mb-1">Points Balance</span>
              <span className="font-mono font-semibold text-pink-300">
                {user.pointsBalance.toLocaleString()} pts
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Account Information */}
      {activeTab === 'account' && (
        <div className="p-6 rounded-3xl bg-[#160A2D]/80 border border-purple-500/20 backdrop-blur-md space-y-5 animate-fadeIn">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span>Authentication & Security Standing</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-[#0E061E]/80 border border-purple-500/15">
              <span className="text-zinc-500 block mb-1">Primary Login Provider</span>
              <span className="font-semibold text-white uppercase">{user.loginProvider}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0E061E]/80 border border-purple-500/15">
              <span className="text-zinc-500 block mb-1">Two-Factor Authentication</span>
              <span
                className={`font-semibold ${
                  user.twoFactor ? 'text-emerald-400' : 'text-zinc-400'
                }`}
              >
                {user.twoFactor ? 'Enabled (App/SMS)' : 'Disabled'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0E061E]/80 border border-purple-500/15">
              <span className="text-zinc-500 block mb-1">Identity Verification</span>
              <span className="font-semibold text-white">{user.verificationStatus}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0E061E]/80 border border-purple-500/15">
              <span className="text-zinc-500 block mb-1">Last Active Session</span>
              <span className="font-semibold text-white">{user.lastActive}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0E061E]/80 border border-purple-500/15">
              <span className="text-zinc-500 block mb-1">Registered Since</span>
              <span className="font-semibold text-white">{user.registrationDate}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Activity Overview */}
      {activeTab === 'activity' && (
        <div className="p-6 rounded-3xl bg-[#160A2D]/80 border border-purple-500/20 backdrop-blur-md space-y-4 animate-fadeIn">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-400" />
            <span>User Activity Timeline</span>
          </h3>

          <div className="space-y-3">
            {user.activityHistory.map((act) => (
              <div
                key={act.id}
                className="p-4 rounded-2xl bg-[#0E061E]/80 border border-purple-500/15 flex items-start justify-between gap-4"
              >
                <div>
                  <div className="font-bold text-white text-xs">{act.action}</div>
                  <div className="text-xs text-zinc-400 mt-0.5">{act.details}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-[10px] text-zinc-500 font-mono">{act.timestamp}</span>
                  <span className="block mt-1 text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                    {act.category}
                  </span>
                </div>
              </div>
            ))}
            {user.activityHistory.length === 0 && (
              <div className="text-xs text-zinc-500 py-6 text-center italic">
                No recent activity logged for this user.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Account History (Status Audit Log) */}
      {activeTab === 'history' && (
        <div className="p-6 rounded-3xl bg-[#160A2D]/80 border border-purple-500/20 backdrop-blur-md space-y-4 animate-fadeIn">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>Account Standing Audit Log</span>
          </h3>

          <div className="space-y-3">
            {user.accountAuditLog.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-2xl bg-[#0E061E]/80 border border-purple-500/15 space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 line-through">
                      {log.previousStatus}
                    </span>
                    <span>→</span>
                    <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 font-bold border border-pink-500/30">
                      {log.newStatus}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">{log.timestamp}</span>
                </div>
                <div className="text-xs text-zinc-300 pt-1">
                  Reason: <em>"{log.reason}"</em>
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">By: {log.changedBy}</div>
              </div>
            ))}
            {user.accountAuditLog.length === 0 && (
              <div className="text-xs text-zinc-500 py-6 text-center italic">
                No status adjustments or moderation actions recorded on this account.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
