'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Bell,
  Building2,
  CheckCircle2,
  ChevronRight,
  Edit3,
  FileText,
  Headphones,
  Heart,
  Info,
  ListTodo,
  MoreVertical,
  RotateCcw,
  Sparkles,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { useUnreadNotificationsCount } from '@/components/notifications/useUnreadNotificationsCount';
import { AgencyEmptyState } from './AgencyEmptyState';
import { AgencyPerformanceSection } from './AgencyPerformanceSection';
import { AgencyProfileSection } from './AgencyProfileSection';
import { AgencySupportSection } from './AgencySupportSection';
import { HostDetailView } from './HostDetailView';
import { HostManagementSection } from './HostManagementSection';
import {
  AGENCY_PERFORMANCE_BY_PERIOD,
  createInitialAgencyHosts,
  createInitialAgencyProfile,
  getAgencyLogoSvg,
} from './mockAgencyData';
import {
  AgencyEmptyKind,
  AgencyHostRecord,
  AgencyProfileData,
  AgencySectionTab,
  HostFilterStatus,
  PerformancePeriod,
} from './types';

export const AgencyManagementScreen: React.FC = () => {
  const unreadNotifications = useUnreadNotificationsCount();

  const [agencyProfile, setAgencyProfile] = useState<AgencyProfileData | null>(
    createInitialAgencyProfile
  );
  const [hosts, setHosts] = useState<AgencyHostRecord[]>(createInitialAgencyHosts);
  const [activeTab, setActiveTab] = useState<AgencySectionTab>('dashboard');
  const [startProfileInEditMode, setStartProfileInEditMode] = useState(false);

  const [hostStatusFilter, setHostStatusFilter] = useState<HostFilterStatus>('All');
  const [selectedHostId, setSelectedHostId] = useState<string | null>(null);
  const [performancePeriod, setPerformancePeriod] = useState<PerformancePeriod>('weekly');
  const [hasPerformanceData, setHasPerformanceData] = useState(true);

  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [forcedEmptyKind, setForcedEmptyKind] = useState<AgencyEmptyKind | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  };

  const hostStats = useMemo(() => {
    let active = 0;
    let pending = 0;
    let inactive = 0;
    let suspended = 0;
    let totalSessions = 0;
    let totalHours = 0;

    hosts.forEach((h) => {
      if (h.status === 'Active') active += 1;
      else if (h.status === 'Pending') pending += 1;
      else if (h.status === 'Inactive') inactive += 1;
      else if (h.status === 'Suspended') suspended += 1;
      totalSessions += h.sampleSessionsThisWeek;
      totalHours += h.sampleLiveHours;
    });

    return {
      total: hosts.length,
      active,
      pending,
      inactive,
      suspended,
      totalSessions,
      totalHours,
      activePercent: hosts.length > 0 ? Math.round((active / hosts.length) * 100) : 0,
    };
  }, [hosts]);

  const selectedHost = useMemo(
    () => hosts.find((h) => h.hostId === selectedHostId) ?? null,
    [hosts, selectedHostId]
  );

  const navigateTab = (
    tab: AgencySectionTab,
    options?: { editProfile?: boolean; hostFilter?: HostFilterStatus }
  ) => {
    setForcedEmptyKind(null);
    setSelectedHostId(null);
    setStartProfileInEditMode(Boolean(options?.editProfile));
    if (options?.hostFilter) {
      setHostStatusFilter(options.hostFilter);
    }
    setActiveTab(tab);
    scrollToTop();
  };

  const handleRestoreAllDemo = () => {
    setForcedEmptyKind(null);
    setAgencyProfile(createInitialAgencyProfile());
    setHosts(createInitialAgencyHosts());
    setHostStatusFilter('All');
    setHasPerformanceData(true);
    setSelectedHostId(null);
    setShowOptionsMenu(false);
    showToast('Sample agency workspace data restored.');
  };

  const triggerEmptyPreview = (kind: AgencyEmptyKind) => {
    setShowOptionsMenu(false);
    setSelectedHostId(null);
    if (kind === 'no_agency_info') {
      setForcedEmptyKind(null);
      setAgencyProfile(null);
      setActiveTab('profile');
      return;
    }
    if (kind === 'no_hosts') {
      setForcedEmptyKind(null);
      setHosts([]);
      setActiveTab('hosts');
      return;
    }
    if (kind === 'no_active_hosts') {
      setForcedEmptyKind(null);
      setHosts(createInitialAgencyHosts().filter((h) => h.status !== 'Active'));
      setHostStatusFilter('Active');
      setActiveTab('hosts');
      return;
    }
    if (kind === 'no_pending_hosts') {
      setForcedEmptyKind(null);
      setHosts(createInitialAgencyHosts().filter((h) => h.status !== 'Pending'));
      setHostStatusFilter('Pending');
      setActiveTab('hosts');
      return;
    }
    if (kind === 'no_performance_data') {
      setForcedEmptyKind(null);
      setHasPerformanceData(false);
      setActiveTab('performance');
      return;
    }
    setForcedEmptyKind(kind);
  };

  const currentPerf = AGENCY_PERFORMANCE_BY_PERIOD[performancePeriod];

  const tabItems: Array<{
    id: AgencySectionTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'dashboard', label: 'Overview', icon: Building2 },
    { id: 'hosts', label: 'Host Management', icon: Users },
    { id: 'profile', label: 'Agency Details', icon: FileText },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'support', label: 'Support', icon: Headphones },
  ];

  return (
    <div className="min-h-screen bg-[#130822] text-white pb-16">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#130822]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/live"
              aria-label="Back to Popo Live"
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <Link href="/live" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-full border-2 border-[#FF2E93] bg-[#210A3A] flex items-center justify-center shadow-[0_0_16px_rgba(255,46,147,0.45)]">
                <span className="w-2.5 h-2.5 rounded-full bg-white" />
              </div>
              <span className="text-base sm:text-lg font-black tracking-tight text-white">
                Popo Live
              </span>
            </Link>
          </div>

          {/* Desktop Quick Nav */}
          <nav className="hidden lg:flex items-center gap-1.5 text-xs font-bold">
            <Link
              href="/live"
              className="px-3 py-1.5 rounded-full text-white/75 hover:text-white hover:bg-white/5 transition"
            >
              Home
            </Link>
            <span className="px-3 py-1.5 rounded-full bg-[#FF2E93] text-white shadow-[0_6px_18px_rgba(255,46,147,0.35)]">
              Agency
            </span>
            <Link
              href="/event-leaderboard"
              className="px-3 py-1.5 rounded-full text-white/75 hover:text-white hover:bg-white/5 transition"
            >
              Event Leaderboard
            </Link>
            <Link
              href="/host-rankings"
              className="px-3 py-1.5 rounded-full text-white/75 hover:text-white hover:bg-white/5 transition"
            >
              Host Rankings
            </Link>
            <Link
              href="/daily-tasks"
              className="px-3 py-1.5 rounded-full text-white/75 hover:text-white hover:bg-white/5 transition"
            >
              Daily Host Tasks
            </Link>
            <Link
              href="/profile"
              className="px-3 py-1.5 rounded-full text-white/75 hover:text-white hover:bg-white/5 transition"
            >
              Profile
            </Link>
          </nav>

          {/* Utility Icons */}
          <div className="flex items-center gap-2 relative">
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="relative w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-[#FF2E93] text-[10px] font-black flex items-center justify-center text-white">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => navigateTab('support')}
              aria-label="Agency Support"
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition"
            >
              <Heart className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setShowOptionsMenu((prev) => !prev)}
              data-testid="agency-options-menu-btn"
              aria-label="Preview Options"
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showOptionsMenu && (
              <div
                data-testid="agency-options-menu"
                className="absolute right-0 top-11 w-64 rounded-2xl bg-[#1F0D39] border border-purple-400/25 shadow-2xl p-2 z-40 text-xs"
              >
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-300/60">
                  Preview Empty States
                </div>
                <button
                  type="button"
                  onClick={() => triggerEmptyPreview('no_agency_info')}
                  data-testid="preview-empty-no-agency"
                  className="w-full text-left px-3 py-2 rounded-xl text-purple-100 hover:bg-white/10 transition"
                >
                  No Agency Information
                </button>
                <button
                  type="button"
                  onClick={() => triggerEmptyPreview('no_hosts')}
                  data-testid="preview-empty-no-hosts"
                  className="w-full text-left px-3 py-2 rounded-xl text-purple-100 hover:bg-white/10 transition"
                >
                  No Hosts Available
                </button>
                <button
                  type="button"
                  onClick={() => triggerEmptyPreview('no_active_hosts')}
                  data-testid="preview-empty-no-active"
                  className="w-full text-left px-3 py-2 rounded-xl text-purple-100 hover:bg-white/10 transition"
                >
                  No Active Hosts
                </button>
                <button
                  type="button"
                  onClick={() => triggerEmptyPreview('no_pending_hosts')}
                  data-testid="preview-empty-no-pending"
                  className="w-full text-left px-3 py-2 rounded-xl text-purple-100 hover:bg-white/10 transition"
                >
                  No Pending Hosts
                </button>
                <button
                  type="button"
                  onClick={() => triggerEmptyPreview('no_performance_data')}
                  data-testid="preview-empty-no-performance"
                  className="w-full text-left px-3 py-2 rounded-xl text-purple-100 hover:bg-white/10 transition"
                >
                  No Performance Data
                </button>
                <div className="my-1 border-t border-white/10" />
                <button
                  type="button"
                  onClick={handleRestoreAllDemo}
                  data-testid="preview-restore-demo"
                  className="w-full text-left px-3 py-2 rounded-xl font-bold text-[#FF6BA3] hover:bg-white/10 flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restore All Sample Data
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        {/* Page Heading + Confirmation Toast */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Agency</h1>
            <p className="text-xs sm:text-sm text-purple-200/75 mt-1">
              Agency overview · Sample host & profile management
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigateTab('profile', { editProfile: true })}
              data-testid="header-edit-agency-btn"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#1D0D34] hover:bg-[#281247] border border-purple-400/25 text-xs font-bold text-purple-100 transition"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#FF6BA3]" />
              Edit Agency Info
            </button>
            <button
              type="button"
              onClick={() => navigateTab('hosts')}
              data-testid="header-open-hosts-btn"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#FF2E93] hover:bg-[#ff429e] text-xs font-bold text-white shadow-[0_6px_18px_rgba(255,46,147,0.35)] transition"
            >
              <Users className="w-3.5 h-3.5" />
              Manage Hosts ({hostStats.total})
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div
            data-testid="agency-toast-banner"
            className="rounded-2xl bg-emerald-500/15 border border-emerald-400/35 px-4 py-3 flex items-center justify-between gap-3 text-xs font-semibold text-emerald-200"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              aria-label="Dismiss notice"
              className="text-emerald-200/80 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Section Tabs */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none"
          role="tablist"
          aria-label="Agency management sections"
        >
          {tabItems.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => navigateTab(tab.id)}
                data-testid={`agency-tab-${tab.id}`}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition border ${
                  active
                    ? 'bg-[#FF2E93] text-white border-[#FF2E93] shadow-[0_6px_20px_rgba(255,46,147,0.35)]'
                    : 'bg-[#1A0B2E] text-purple-200/80 border-purple-400/20 hover:border-purple-300/40 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Forced empty overlay if previewing empty state directly */}
        {forcedEmptyKind ? (
          <AgencyEmptyState kind={forcedEmptyKind} onAction={handleRestoreAllDemo} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Main Column */}
            <div className="lg:col-span-8 space-y-5">
              {activeTab === 'dashboard' && (
                <>
                  {/* Hero Agency Card matching 09_07_agency.png */}
                  {agencyProfile ? (
                    <section
                      data-testid="agency-hero-card"
                      className="rounded-3xl bg-[#1D0D34]/95 border border-purple-400/25 p-5 sm:p-6 shadow-[0_18px_46px_rgba(9,3,22,0.55)]"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={getAgencyLogoSvg(agencyProfile.logoPreset)}
                            alt={agencyProfile.agencyName}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full shrink-0 shadow-[0_0_24px_rgba(251,191,36,0.22)]"
                          />
                          <div className="min-w-0">
                            <h2
                              data-testid="dashboard-agency-name"
                              className="text-lg sm:text-xl font-black text-white truncate"
                            >
                              {agencyProfile.agencyName}
                            </h2>
                            <p className="text-xs text-purple-200/75 mt-0.5">
                              Agency ID:{' '}
                              <span className="font-mono text-purple-100">
                                {agencyProfile.agencyId}
                              </span>
                            </p>
                            <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              {agencyProfile.status}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigateTab('profile')}
                            data-testid="dashboard-open-profile-btn"
                            className="px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-purple-400/25 text-xs font-bold text-white transition"
                          >
                            Agency Profile
                          </button>
                          <button
                            type="button"
                            onClick={() => navigateTab('profile', { editProfile: true })}
                            data-testid="dashboard-edit-info-btn"
                            className="px-3.5 py-2 rounded-full bg-[#FF2E93]/20 hover:bg-[#FF2E93] border border-[#FF2E93]/40 text-xs font-bold text-pink-100 hover:text-white transition"
                          >
                            Edit Info
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 pt-3.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-purple-200/75">
                        <span>Agency summary</span>
                        <span>
                          Owner: <strong className="text-white">{agencyProfile.ownerName}</strong> ·{' '}
                          {agencyProfile.createdDateLabel}
                        </span>
                      </div>
                    </section>
                  ) : (
                    <AgencyEmptyState kind="no_agency_info" onAction={handleRestoreAllDemo} />
                  )}

                  {/* 3 Main Stat Cards matching 09_07_agency.png */}
                  <section
                    aria-label="Agency summary stats"
                    className="grid grid-cols-3 gap-2.5 sm:gap-3.5"
                  >
                    <button
                      type="button"
                      onClick={() => navigateTab('hosts', { hostFilter: 'All' })}
                      data-testid="stat-total-hosts"
                      className="rounded-2xl sm:rounded-3xl bg-[#1A0B2E] hover:bg-[#23103D] border border-purple-400/20 p-3.5 sm:p-5 text-center transition shadow-[0_12px_30px_rgba(9,3,22,0.45)]"
                    >
                      <div className="text-xl sm:text-3xl font-black text-white">
                        {hostStats.total}
                      </div>
                      <div className="text-[11px] sm:text-xs font-semibold text-purple-200/75 mt-1">
                        Hosts
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigateTab('hosts', { hostFilter: 'Active' })}
                      data-testid="stat-active-hosts"
                      className="rounded-2xl sm:rounded-3xl bg-[#1A0B2E] hover:bg-[#23103D] border border-purple-400/20 p-3.5 sm:p-5 text-center transition shadow-[0_12px_30px_rgba(9,3,22,0.45)]"
                    >
                      <div className="text-xl sm:text-3xl font-black text-emerald-300">
                        {hostStats.active}
                      </div>
                      <div className="text-[11px] sm:text-xs font-semibold text-purple-200/75 mt-1">
                        Active
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigateTab('hosts', { hostFilter: 'Pending' })}
                      data-testid="stat-pending-hosts"
                      className="rounded-2xl sm:rounded-3xl bg-[#1A0B2E] hover:bg-[#23103D] border border-purple-400/20 p-3.5 sm:p-5 text-center transition shadow-[0_12px_30px_rgba(9,3,22,0.45)]"
                    >
                      <div className="text-xl sm:text-3xl font-black text-amber-300">
                        {hostStats.pending}
                      </div>
                      <div className="text-[11px] sm:text-xs font-semibold text-purple-200/75 mt-1">
                        Pending
                      </div>
                    </button>
                  </section>

                  {/* Extended Agency Summary Strip (Inactive + Sample Activity + Progress Bar) */}
                  <section className="rounded-3xl bg-[#1A0B2E]/95 border border-purple-400/20 p-4 sm:p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h2 className="text-sm font-black text-white">
                          Agency Summary & Performance Overview
                        </h2>
                        <p className="text-[11px] text-purple-200/70">
                          Sample activity metrics only — no financial commissions or payouts shown
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigateTab('performance')}
                        className="text-xs font-bold text-[#FF6BA3] hover:underline"
                      >
                        View Charts →
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      <div className="rounded-2xl bg-[#120624]/85 border border-purple-400/15 p-3">
                        <div className="text-[10px] text-purple-300/70">Inactive Hosts</div>
                        <div className="text-base font-black text-slate-200 mt-0.5">
                          {hostStats.inactive}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-[#120624]/85 border border-purple-400/15 p-3">
                        <div className="text-[10px] text-purple-300/70">Suspended (Demo)</div>
                        <div className="text-base font-black text-rose-300 mt-0.5">
                          {hostStats.suspended}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-[#120624]/85 border border-purple-400/15 p-3">
                        <div className="text-[10px] text-purple-300/70">Sample Sessions</div>
                        <div className="text-base font-black text-[#FF6BA3] mt-0.5">
                          {hostStats.totalSessions} / wk
                        </div>
                      </div>
                      <div className="rounded-2xl bg-[#120624]/85 border border-purple-400/15 p-3">
                        <div className="text-[10px] text-purple-300/70">Live Hours</div>
                        <div className="text-base font-black text-amber-300 mt-0.5">
                          {hostStats.totalHours.toFixed(1)} hrs
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[11px] text-purple-200/80 mb-1.5">
                        <span>Active Roster Ratio</span>
                        <span className="font-bold text-white">{hostStats.activePercent}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#FF2E93] to-amber-300 transition-all"
                          style={{ width: `${hostStats.activePercent}%` }}
                        />
                      </div>
                    </div>
                  </section>

                  {/* Agency Management 4 Quick Navigation Cards matching 09_07_agency.png */}
                  <section className="space-y-3" data-testid="agency-management-nav-list">
                    <h2 className="text-base sm:text-lg font-black text-white">
                      Agency management
                    </h2>

                    <div className="space-y-2.5">
                      <button
                        type="button"
                        onClick={() => navigateTab('hosts')}
                        data-testid="nav-card-hosts"
                        className="w-full rounded-2xl bg-[#1D0D34] hover:bg-[#251243] border border-purple-400/20 hover:border-[#FF2E93]/45 px-4 sm:px-5 py-4 flex items-center justify-between gap-3 text-left transition shadow-[0_10px_28px_rgba(9,3,22,0.45)]"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-[#FF2E93]/15 border border-[#FF2E93]/30 flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5 text-[#FF6BA3]" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm sm:text-base font-black text-white">
                              Host Management
                            </div>
                            <div className="text-xs text-purple-200/75 truncate">
                              View and manage agency hosts ({hostStats.total} sample records)
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-purple-300/70 shrink-0" />
                      </button>

                      <button
                        type="button"
                        onClick={() => navigateTab('profile')}
                        data-testid="nav-card-details"
                        className="w-full rounded-2xl bg-[#1D0D34] hover:bg-[#251243] border border-purple-400/20 hover:border-[#FF2E93]/45 px-4 sm:px-5 py-4 flex items-center justify-between gap-3 text-left transition shadow-[0_10px_28px_rgba(9,3,22,0.45)]"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-purple-200" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm sm:text-base font-black text-white">
                              Agency Details
                            </div>
                            <div className="text-xs text-purple-200/75 truncate">
                              Profile and agency information
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-purple-300/70 shrink-0" />
                      </button>

                      <button
                        type="button"
                        onClick={() => navigateTab('performance')}
                        data-testid="nav-card-performance"
                        className="w-full rounded-2xl bg-[#1D0D34] hover:bg-[#251243] border border-purple-400/20 hover:border-[#FF2E93]/45 px-4 sm:px-5 py-4 flex items-center justify-between gap-3 text-left transition shadow-[0_10px_28px_rgba(9,3,22,0.45)]"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center shrink-0">
                            <Activity className="w-5 h-5 text-amber-300" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm sm:text-base font-black text-white">
                              Performance
                            </div>
                            <div className="text-xs text-purple-200/75 truncate">
                              Review agency activity ({currentPerf.totalSessions} {performancePeriod}{' '}
                              sessions)
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-purple-300/70 shrink-0" />
                      </button>

                      <button
                        type="button"
                        onClick={() => navigateTab('support')}
                        data-testid="nav-card-support"
                        className="w-full rounded-2xl bg-[#1D0D34] hover:bg-[#251243] border border-purple-400/20 hover:border-[#FF2E93]/45 px-4 sm:px-5 py-4 flex items-center justify-between gap-3 text-left transition shadow-[0_10px_28px_rgba(9,3,22,0.45)]"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center shrink-0">
                            <Headphones className="w-5 h-5 text-emerald-300" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm sm:text-base font-black text-white">
                              Support
                            </div>
                            <div className="text-xs text-purple-200/75 truncate">
                              Agency help and information
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-purple-300/70 shrink-0" />
                      </button>
                    </div>
                  </section>
                </>
              )}

              {activeTab === 'profile' && (
                <AgencyProfileSection
                  profile={agencyProfile}
                  totalHosts={hostStats.total}
                  activeHosts={hostStats.active}
                  initialEditing={startProfileInEditMode}
                  onSaveProfile={(updated) => {
                    setAgencyProfile(updated);
                    setStartProfileInEditMode(false);
                    showToast(`Saved local demo changes for ${updated.agencyName}.`);
                  }}
                  onRestoreProfile={handleRestoreAllDemo}
                  onCancelEditNotice={() => {
                    setStartProfileInEditMode(false);
                    showToast('Agency profile edits discarded.');
                  }}
                />
              )}

              {activeTab === 'hosts' && (
                <>
                  {selectedHost && agencyProfile ? (
                    <HostDetailView
                      host={selectedHost}
                      agency={agencyProfile}
                      onBack={() => {
                        setSelectedHostId(null);
                        scrollToTop();
                      }}
                    />
                  ) : (
                    <HostManagementSection
                      hosts={hosts}
                      statusFilter={hostStatusFilter}
                      onStatusFilterChange={setHostStatusFilter}
                      onSelectHost={(hostId) => {
                        setSelectedHostId(hostId);
                        scrollToTop();
                      }}
                      onRestoreHosts={() => {
                        setHosts(createInitialAgencyHosts());
                        setHostStatusFilter('All');
                        showToast('Sample host roster restored.');
                      }}
                    />
                  )}
                </>
              )}

              {activeTab === 'performance' && (
                <AgencyPerformanceSection
                  period={performancePeriod}
                  onPeriodChange={setPerformancePeriod}
                  hasData={hasPerformanceData}
                  onRestoreData={() => {
                    setHasPerformanceData(true);
                    showToast('Sample agency performance metrics restored.');
                  }}
                />
              )}

              {activeTab === 'support' && (
                <AgencySupportSection onShowNotice={showToast} />
              )}
            </div>

            {/* Desktop Right Sidebar */}
            <aside className="lg:col-span-4 space-y-4">
              {/* Roster Snapshot Card */}
              <div className="rounded-3xl bg-[#1A0B2E]/95 border border-purple-400/20 p-5 space-y-4 shadow-[0_14px_38px_rgba(9,3,22,0.5)]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-purple-200/80">
                    Roster Snapshot
                  </span>
                  <span className="text-[11px] font-mono text-amber-300">
                    {agencyProfile?.agencyId ?? 'AG-2048'}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-300 font-semibold">Active</span>
                    <span className="font-bold text-white">{hostStats.active} hosts</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-amber-300 font-semibold">Pending</span>
                    <span className="font-bold text-white">{hostStats.pending} hosts</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-semibold">Inactive</span>
                    <span className="font-bold text-white">{hostStats.inactive} hosts</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-rose-300 font-semibold">Suspended (Demo)</span>
                    <span className="font-bold text-white">{hostStats.suspended} hosts</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigateTab('hosts')}
                  className="w-full py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-purple-400/25 text-xs font-bold text-white transition"
                >
                  Open Host Directory →
                </button>
              </div>

              {/* Creator Hub Shortcuts */}
              <div className="rounded-3xl bg-[#1A0B2E]/95 border border-purple-400/20 p-5 space-y-2.5 shadow-[0_14px_38px_rgba(9,3,22,0.5)]">
                <div className="text-xs font-black uppercase tracking-wider text-purple-200/80 mb-1">
                  Creator Hub Shortcuts
                </div>
                <Link
                  href="/daily-tasks"
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#120624]/85 hover:bg-white/10 border border-purple-400/15 text-xs font-bold text-purple-100 transition"
                >
                  <span className="flex items-center gap-2">
                    <ListTodo className="w-3.5 h-3.5 text-[#FF6BA3]" />
                    Daily Host Tasks
                  </span>
                  <ChevronRight className="w-4 h-4 text-purple-300/60" />
                </Link>
                <Link
                  href="/task-level"
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#120624]/85 hover:bg-white/10 border border-purple-400/15 text-xs font-bold text-purple-100 transition"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    Task Level
                  </span>
                  <ChevronRight className="w-4 h-4 text-purple-300/60" />
                </Link>
                <Link
                  href="/host-rankings"
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#120624]/85 hover:bg-white/10 border border-purple-400/15 text-xs font-bold text-purple-100 transition"
                >
                  <span className="flex items-center gap-2">
                    <Trophy className="w-3.5 h-3.5 text-amber-300" />
                    Host Rankings
                  </span>
                  <ChevronRight className="w-4 h-4 text-purple-300/60" />
                </Link>
              </div>

              {/* Scope Notice */}
              <div className="rounded-3xl bg-[#160929] border border-purple-400/15 p-4 flex items-start gap-2.5 text-[11px] text-purple-200/75 leading-relaxed">
                <Info className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <span>
                  Agency Management uses local frontend demo state and remains separate from real
                  registration, moderation, and Agent Earnings calculations.
                </span>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
};
