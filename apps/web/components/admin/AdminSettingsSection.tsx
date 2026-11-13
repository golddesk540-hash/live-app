'use client';

import React, { useState } from 'react';
import { AdminProfileData } from './types';

interface AdminSettingsSectionProps {
  profile: AdminProfileData;
  onUpdateProfile: (updatedProfile: AdminProfileData) => void;
  onOpenComingSoon: (title: string, phaseModule: string) => void;
}

export const AdminSettingsSection: React.FC<AdminSettingsSectionProps> = ({
  profile,
  onUpdateProfile,
  onOpenComingSoon,
}) => {
  const [twoFactor, setTwoFactor] = useState(profile.twoFactorEnabled);
  const [sessionTimeout, setSessionTimeout] = useState(profile.sessionTimeoutMinutes);
  const [auditLogging, setAuditLogging] = useState(profile.auditLoggingEnabled);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const handleSaveSettings = () => {
    const updated: AdminProfileData = {
      ...profile,
      twoFactorEnabled: twoFactor,
      sessionTimeoutMinutes: sessionTimeout,
      auditLoggingEnabled: auditLogging,
    };
    onUpdateProfile(updated);
    setSaveSuccess('Security preferences and session policies updated.');
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  const upcomingModules = [
    {
      code: '10.4',
      title: 'Reports & Safety Queue',
      desc: 'Triage user abuse reports, automated chat toxicity flags, and safety sanctions.',
    },
    {
      code: '10.5',
      title: 'Economy & Coin Management',
      desc: 'Coin pricing packages, reseller quota pools, host point conversions, and payouts.',
    },
    {
      code: '10.6',
      title: 'Agency Management Center',
      desc: 'Agency registration reviews, agent commission rules, and creator roster oversight.',
    },
    {
      code: '10.7',
      title: 'Content & Banners',
      desc: 'App banners, discovery announcements, broadcast category hierarchy, and localized assets.',
    },
    {
      code: '10.8',
      title: 'App Configuration & Settings',
      desc: 'Global app parameters, feature flags, maintenance mode toggles, and API keys.',
    },
  ];

  return (
    <section className="space-y-6" id="settings-section">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_10px_#FF0F7B]" />
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">
            Admin Profile & Platform Governance
          </h2>
        </div>
        <p className="text-xs md:text-sm text-zinc-400 mt-1">
          Personal session credentials, multi-factor authentication, and platform modules status.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Grid: Profile Card & Security Policies */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Current Admin Profile */}
        <div className="lg:col-span-5 p-5 md:p-6 rounded-3xl bg-[#160A2D]/80 border border-purple-500/20 backdrop-blur-md shadow-xl space-y-5">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-pink-400" />
            <span>Active Admin Profile</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-16 h-16 rounded-3xl object-cover border-2 border-pink-500/40 shadow-[0_0_15px_rgba(255,15,123,0.3)]"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#160A2D] bg-emerald-400 shadow-[0_0_8px_#34D399]" />
            </div>
            <div>
              <div className="text-lg font-bold text-white">{profile.name}</div>
              <div className="text-xs text-pink-400 font-medium">{profile.username}</div>
              <div className="text-xs text-zinc-400 mt-0.5">{profile.email}</div>
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-purple-500/15 text-xs text-zinc-300">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Admin ID:</span>
              <span className="font-mono text-zinc-200 font-bold">{profile.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Security Clearance:</span>
              <span className="px-2 py-0.5 rounded-lg bg-pink-500/20 text-pink-300 border border-pink-500/40 font-semibold">
                {profile.role}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Standing:</span>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                {profile.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Department:</span>
              <span className="text-zinc-200">Platform Architecture & Operations</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0E061E]/80 border border-purple-500/20 text-xs text-zinc-400 space-y-1">
            <div className="font-semibold text-zinc-200">Demo Administrative Session</div>
            <div>Operating under elevated Super Admin credentials for testing and verification.</div>
          </div>
        </div>

        {/* Right: Security & Session Policies */}
        <div className="lg:col-span-7 p-5 md:p-6 rounded-3xl bg-[#160A2D]/80 border border-purple-500/20 backdrop-blur-md shadow-xl space-y-5">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span>Platform Governance & Security Controls</span>
          </div>

          <div className="space-y-4">
            {/* 2FA Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0E061E]/70 border border-purple-500/20">
              <div>
                <div className="font-semibold text-white text-sm">Two-Factor Authentication (2FA)</div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  Enforce hardware security keys or authenticator apps on administrative login.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTwoFactor(!twoFactor)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  twoFactor ? 'bg-pink-500 shadow-[0_0_10px_#FF0F7B]' : 'bg-zinc-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    twoFactor ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Session Timeout */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#0E061E]/70 border border-purple-500/20">
              <div>
                <div className="font-semibold text-white text-sm">Inactivity Session Timeout</div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  Automatically invalidate idle administrative tokens after inactivity.
                </div>
              </div>
              <select
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(Number(e.target.value))}
                className="px-3 py-1.5 rounded-xl bg-[#160A2D] border border-purple-500/30 text-zinc-200 text-xs focus:outline-none focus:border-pink-500"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={60}>1 Hour</option>
                <option value={240}>4 Hours</option>
              </select>
            </div>

            {/* Audit Logging Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0E061E]/70 border border-purple-500/20">
              <div>
                <div className="font-semibold text-white text-sm">Immutable Audit Trail Logging</div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  Stream all administrative actions, role updates, and user modifications to the audit log.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAuditLogging(!auditLogging)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  auditLogging ? 'bg-pink-500 shadow-[0_0_10px_#FF0F7B]' : 'bg-zinc-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    auditLogging ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSaveSettings}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-semibold text-xs shadow-[0_0_15px_rgba(255,15,123,0.3)] transition-all"
            >
              Save Security Policies
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming Phase 10 Modules Roadmap */}
      <div className="p-5 md:p-6 rounded-3xl bg-[#160A2D]/80 border border-purple-500/20 backdrop-blur-md shadow-xl space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
            <span>Popo Live Phase 10 Administrative Suite Roadmap</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Phase 10 modules are scheduled for sequential development following Module 10.1 approval.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 pt-2">
          {upcomingModules.map((m) => (
            <button
              key={m.code}
              onClick={() => onOpenComingSoon(m.title, `Module ${m.code}`)}
              className="p-4 rounded-2xl bg-[#0E061E]/70 border border-purple-500/20 hover:border-pink-500/50 hover:bg-[#0E061E] text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold">
                  {m.code}
                </span>
                <span className="text-[10px] font-medium text-pink-400 opacity-80 group-hover:opacity-100 flex items-center gap-1">
                  Preview
                  <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
              <div className="font-bold text-white text-xs group-hover:text-pink-300 transition-colors">
                {m.title}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                {m.desc}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
