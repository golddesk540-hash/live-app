'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpDown,
  Bell,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  FileSpreadsheet,
  Heart,
  Info,
  MoreVertical,
  RotateCcw,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useUnreadNotificationsCount } from '@/components/notifications/useUnreadNotificationsCount';
import { Avatar } from '@/components/ui/Avatar';
import { AgentEarningsCharts } from './AgentEarningsCharts';
import { AgentEmptyState } from './AgentEmptyState';
import { CommissionHistorySection } from './CommissionHistorySection';
import { EarningDetailView, getEarningStatusPillStyle } from './EarningDetailView';
import { HostActivityEarningsSection } from './HostActivityEarningsSection';
import {
  createInitialAgentProfile,
  createInitialCommissionHistory,
  createInitialEarningRecords,
  createInitialHostActivityEarnings,
  formatSamplePts,
  INITIAL_AGENT_SUMMARY,
  mapDatePeriodToChartMode,
  matchesDatePeriod,
} from './mockAgentEarningsData';
import {
  AgentEarningsTab,
  AgentEarningRecord,
  AgentEmptyKind,
  ChartViewMode,
  CommissionHistoryRecord,
  DateFilterPeriod,
  EarningDetailPayload,
  EarningRecordStatus,
  HostActivityEarningItem,
  TransactionSortMode,
} from './types';

type ActivityStatusFilter = 'All' | 'Pending' | 'Completed' | 'Processing';

export const AgentEarningsScreen: React.FC = () => {
  const unreadNotifications = useUnreadNotificationsCount();

  const agentProfile = useMemo(() => createInitialAgentProfile(), []);
  const summary = INITIAL_AGENT_SUMMARY;

  const [records, setRecords] = useState<AgentEarningRecord[]>(createInitialEarningRecords);
  const [commissions, setCommissions] = useState<CommissionHistoryRecord[]>(
    createInitialCommissionHistory
  );
  const [hostActivityItems, setHostActivityItems] = useState<HostActivityEarningItem[]>(
    createInitialHostActivityEarnings
  );

  const [activeTab, setActiveTab] = useState<AgentEarningsTab>('dashboard');
  const [datePeriod, setDatePeriod] = useState<DateFilterPeriod>('this_month');
  const [customStartDate, setCustomStartDate] = useState('2026-10-01');
  const [customEndDate, setCustomEndDate] = useState('2026-11-12');
  const [chartMode, setChartMode] = useState<ChartViewMode>('monthly');

  const [activityStatusFilter, setActivityStatusFilter] = useState<ActivityStatusFilter>('All');
  const [activitySearch, setActivitySearch] = useState('');
  const [sortMode, setSortMode] = useState<TransactionSortMode>('date_desc');

  const [selectedDetail, setSelectedDetail] = useState<EarningDetailPayload | null>(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [forcedEmptyKind, setForcedEmptyKind] = useState<AgentEmptyKind | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  };

  const handleDatePeriodChange = (period: DateFilterPeriod) => {
    setDatePeriod(period);
    setChartMode(mapDatePeriodToChartMode(period));
    setToastMessage(`Showing sample records for ${period.replace('_', ' ')} period.`);
  };

  const filteredRecords = useMemo(() => {
    const q = activitySearch.trim().toLowerCase();
    const list = records.filter((rec) => {
      if (activityStatusFilter !== 'All' && rec.status !== activityStatusFilter) return false;
      if (!matchesDatePeriod(rec.dateIso, datePeriod, customStartDate, customEndDate)) {
        return false;
      }
      if (q) {
        const hay = `${rec.id} ${rec.title} ${rec.category} ${rec.hostName} ${rec.referenceCode}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortMode === 'date_desc') return b.dateIso.localeCompare(a.dateIso);
      if (sortMode === 'date_asc') return a.dateIso.localeCompare(b.dateIso);
      if (sortMode === 'amount_desc') return b.sampleAmountPts - a.sampleAmountPts;
      return a.sampleAmountPts - b.sampleAmountPts;
    });
  }, [records, activityStatusFilter, datePeriod, customStartDate, customEndDate, activitySearch, sortMode]);

  const pendingOnlyRecords = useMemo(
    () => records.filter((r) => r.status === 'Pending'),
    [records]
  );

  const completedOnlyRecords = useMemo(
    () => records.filter((r) => r.status === 'Completed'),
    [records]
  );

  const openEarningDetail = (rec: AgentEarningRecord) => {
    setSelectedDetail({
      recordId: rec.id,
      category: rec.category,
      relatedHostOrActivity: `${rec.title} · ${rec.hostName}`,
      hostHandle: rec.hostHandle,
      hostAvatarUrl: rec.hostAvatarUrl,
      hostId: rec.hostId,
      dateLabel: `${rec.dateLabel} (${rec.dateIso})`,
      referenceCode: rec.referenceCode,
      sampleAmountPts: rec.sampleAmountPts,
      status: rec.status as EarningRecordStatus,
      additionalInfo: rec.summaryNote,
    });
    scrollToTop();
  };

  const handleRestoreAllDemo = () => {
    setForcedEmptyKind(null);
    setRecords(createInitialEarningRecords());
    setCommissions(createInitialCommissionHistory());
    setHostActivityItems(createInitialHostActivityEarnings());
    setActivityStatusFilter('All');
    setDatePeriod('this_month');
    setChartMode('monthly');
    setActivitySearch('');
    setSelectedDetail(null);
    setActiveTab('dashboard');
    setShowOptionsMenu(false);
    setToastMessage('Sample Agent Earnings data restored.');
  };

  const triggerEmptyPreview = (kind: AgentEmptyKind) => {
    setShowOptionsMenu(false);
    setSelectedDetail(null);
    setActivitySearch('');
    if (kind === 'no_earnings') {
      setForcedEmptyKind(null);
      setRecords([]);
      setActiveTab('dashboard');
      return;
    }
    if (kind === 'no_pending') {
      setForcedEmptyKind(null);
      setRecords(createInitialEarningRecords().filter((r) => r.status !== 'Pending'));
      setActivityStatusFilter('Pending');
      setDatePeriod('this_month');
      setActiveTab('dashboard');
      return;
    }
    if (kind === 'no_completed') {
      setForcedEmptyKind(null);
      setRecords(createInitialEarningRecords().filter((r) => r.status !== 'Completed'));
      setActivityStatusFilter('Completed');
      setDatePeriod('this_month');
      setActiveTab('dashboard');
      return;
    }
    if (kind === 'no_commission_history') {
      setForcedEmptyKind(null);
      setCommissions([]);
      setActiveTab('commission');
      return;
    }
    if (kind === 'no_host_activity') {
      setForcedEmptyKind(null);
      setHostActivityItems([]);
      setActiveTab('host_activity');
      return;
    }
    setForcedEmptyKind(kind);
  };

  const navTabs: Array<{
    id: AgentEarningsTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'dashboard', label: 'Overview', icon: Wallet },
    { id: 'monthly', label: 'Monthly & Pending', icon: Calendar },
    { id: 'commission', label: 'Commission History', icon: FileSpreadsheet },
    { id: 'host_activity', label: 'Host Activity', icon: Users },
  ];

  const dateFilterButtons: Array<{ id: DateFilterPeriod; label: string }> = [
    { id: 'today', label: 'Today' },
    { id: 'this_week', label: 'This Week' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'custom', label: 'Custom Range' },
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

            <Link href="/live" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full border-2 border-[#FF2E93] bg-[#210A3A] flex items-center justify-center shadow-[0_0_16px_rgba(255,46,147,0.45)]">
                <span className="w-2.5 h-2.5 rounded-full bg-white" />
              </div>
              <span className="text-base sm:text-lg font-black tracking-tight text-white">
                Popo Live
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1.5 text-xs font-bold">
            <Link
              href="/live"
              className="px-3 py-1.5 rounded-full text-white/75 hover:text-white hover:bg-white/5 transition"
            >
              Home
            </Link>
            <span className="px-3 py-1.5 rounded-full bg-[#FF2E93] text-white shadow-[0_6px_18px_rgba(255,46,147,0.35)]">
              Agent Earnings
            </span>
            <Link
              href="/agency-management"
              className="px-3 py-1.5 rounded-full text-white/75 hover:text-white hover:bg-white/5 transition"
            >
              Agency
            </Link>
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
              href="/profile"
              className="px-3 py-1.5 rounded-full text-white/75 hover:text-white hover:bg-white/5 transition"
            >
              Profile
            </Link>
          </nav>

          {/* Utility Icons + Empty State Preview Menu */}
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

            <Link
              href="/earnings?preview=demo"
              aria-label="Host Earnings"
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition"
            >
              <Heart className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={() => setShowOptionsMenu((prev) => !prev)}
              data-testid="agent-options-menu-btn"
              aria-label="Preview Options"
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showOptionsMenu && (
              <div
                data-testid="agent-options-menu"
                className="absolute right-0 top-11 w-64 rounded-2xl bg-[#1F0D39] border border-purple-400/25 shadow-2xl p-2 z-40 text-xs"
              >
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-300/60">
                  Preview Empty States
                </div>
                <button
                  type="button"
                  onClick={() => triggerEmptyPreview('no_earnings')}
                  data-testid="preview-empty-no-earnings"
                  className="w-full text-left px-3 py-2 rounded-xl text-purple-100 hover:bg-white/10 transition"
                >
                  No Earnings Records
                </button>
                <button
                  type="button"
                  onClick={() => triggerEmptyPreview('no_pending')}
                  data-testid="preview-empty-no-pending"
                  className="w-full text-left px-3 py-2 rounded-xl text-purple-100 hover:bg-white/10 transition"
                >
                  No Pending Earnings
                </button>
                <button
                  type="button"
                  onClick={() => triggerEmptyPreview('no_completed')}
                  data-testid="preview-empty-no-completed"
                  className="w-full text-left px-3 py-2 rounded-xl text-purple-100 hover:bg-white/10 transition"
                >
                  No Completed Earnings
                </button>
                <button
                  type="button"
                  onClick={() => triggerEmptyPreview('no_commission_history')}
                  data-testid="preview-empty-no-commission"
                  className="w-full text-left px-3 py-2 rounded-xl text-purple-100 hover:bg-white/10 transition"
                >
                  No Commission History
                </button>
                <button
                  type="button"
                  onClick={() => triggerEmptyPreview('no_host_activity')}
                  data-testid="preview-empty-no-host-activity"
                  className="w-full text-left px-3 py-2 rounded-xl text-purple-100 hover:bg-white/10 transition"
                >
                  No Host Activity Records
                </button>
                <div className="my-1 border-t border-white/10" />
                <button
                  type="button"
                  onClick={handleRestoreAllDemo}
                  data-testid="preview-restore-agent-demo"
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
        {/* Top Heading + Agent Profile Identity */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Agent Earnings
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/75 mt-1">
              Earning overview and activity · {agentProfile.demoCaption}
            </p>
          </div>

          <div
            data-testid="agent-identity-chip"
            className="inline-flex items-center gap-3 rounded-2xl bg-[#1A0B2E] border border-purple-400/20 px-3.5 py-2 self-start sm:self-auto"
          >
            <Avatar
              src={agentProfile.avatarUrl}
              alt={agentProfile.username}
              size="sm"
              ring="vip"
            />
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">
                {agentProfile.username}
              </div>
              <div className="text-[10px] text-purple-200/75 font-mono">
                ID: {agentProfile.agentId} · {agentProfile.handle}
              </div>
            </div>
          </div>
        </div>

        {/* Toast Feedback */}
        {toastMessage && (
          <div
            data-testid="agent-toast-banner"
            className="rounded-2xl bg-emerald-500/15 border border-emerald-400/35 px-4 py-2.5 flex items-center justify-between gap-3 text-xs font-semibold text-emerald-200"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              aria-label="Dismiss toast"
              className="text-emerald-200/80 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Section Tabs */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none"
          role="tablist"
          aria-label="Agent earnings sections"
        >
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id && !selectedDetail;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setForcedEmptyKind(null);
                  setSelectedDetail(null);
                  setActiveTab(tab.id);
                  scrollToTop();
                }}
                data-testid={`agent-tab-${tab.id}`}
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

        {/* Main Content Grid */}
        {forcedEmptyKind ? (
          <AgentEmptyState kind={forcedEmptyKind} onAction={handleRestoreAllDemo} />
        ) : selectedDetail ? (
          <EarningDetailView
            detail={selectedDetail}
            onBack={() => {
              setSelectedDetail(null);
              scrollToTop();
            }}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-8 space-y-5">
              {activeTab === 'dashboard' && (
                <>
                  {/* Hero TOTAL EARNINGS Card matching 09_08_agent_earnings.png */}
                  <section
                    data-testid="agent-total-earnings-card"
                    className="rounded-3xl bg-gradient-to-br from-[#230E3F] via-[#1D0D34] to-[#160828] border border-purple-400/25 p-5 sm:p-6 shadow-[0_18px_46px_rgba(9,3,22,0.55)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-purple-200/75">
                          Total Earnings
                        </div>
                        <div
                          data-testid="hero-total-earnings-value"
                          className="text-3xl sm:text-5xl font-black text-white mt-2 tracking-tight"
                        >
                          {formatSamplePts(summary.totalEarningsPts)}
                        </div>
                        <p className="text-xs text-purple-200/75 mt-1.5">
                          Sample points · Demo data (Accumulated preview total in pts)
                        </p>
                      </div>

                      <div className="w-11 h-11 rounded-2xl bg-amber-400/15 border border-amber-400/35 flex items-center justify-center">
                        <Coins className="w-5 h-5 text-amber-300" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-white/10 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setActivityStatusFilter('Completed');
                          setToastMessage('Filtered transaction list to Completed sample records.');
                        }}
                        className="rounded-2xl bg-[#120624]/80 hover:bg-[#190930] border border-emerald-400/25 p-3 text-left transition"
                      >
                        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/80">
                          Completed Earnings
                        </div>
                        <div className="text-base sm:text-lg font-black text-emerald-300 mt-1">
                          {formatSamplePts(summary.completedEarningsPts)} pts
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActivityStatusFilter('Pending');
                          setToastMessage('Filtered transaction list to Pending sample records.');
                        }}
                        className="rounded-2xl bg-[#120624]/80 hover:bg-[#190930] border border-amber-400/25 p-3 text-left transition"
                      >
                        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300/80">
                          Pending Earnings
                        </div>
                        <div className="text-base sm:text-lg font-black text-amber-300 mt-1">
                          {formatSamplePts(summary.pendingEarningsPts)} pts
                        </div>
                      </button>
                    </div>
                  </section>

                  {/* Earning Summary Stack matching 09_08_agent_earnings.png */}
                  <section className="space-y-3" data-testid="agent-earning-summary-cards">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-base sm:text-lg font-black text-white">
                        Earning summary
                      </h2>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('monthly');
                          scrollToTop();
                        }}
                        className="text-xs font-bold text-[#FF6BA3] hover:underline"
                      >
                        Monthly Breakdown →
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleDatePeriodChange('this_month')}
                        data-testid="summary-card-this-month"
                        className="rounded-2xl bg-[#1D0D34] hover:bg-[#251243] border border-purple-400/20 p-4 text-left transition shadow-[0_10px_28px_rgba(9,3,22,0.45)]"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-black text-white">This month</span>
                          <TrendingUp className="w-4 h-4 text-[#FF6BA3]" />
                        </div>
                        <div className="text-lg font-black text-amber-300 mt-1">
                          {formatSamplePts(summary.thisMonthPts)} pts
                        </div>
                        <p className="text-[11px] text-purple-200/70 mt-0.5">
                          Current month sample total
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDatePeriodChange('last_month')}
                        data-testid="summary-card-last-month"
                        className="rounded-2xl bg-[#1D0D34] hover:bg-[#251243] border border-purple-400/20 p-4 text-left transition shadow-[0_10px_28px_rgba(9,3,22,0.45)]"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-black text-white">Last month</span>
                          <Calendar className="w-4 h-4 text-purple-300" />
                        </div>
                        <div className="text-lg font-black text-white mt-1">
                          {formatSamplePts(summary.lastMonthPts)} pts
                        </div>
                        <p className="text-[11px] text-purple-200/70 mt-0.5">
                          Previous month demo archive
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDatePeriod('this_month');
                          setActivityStatusFilter('Pending');
                        }}
                        data-testid="summary-card-pending"
                        className="rounded-2xl bg-[#1D0D34] hover:bg-[#251243] border border-purple-400/20 p-4 text-left transition shadow-[0_10px_28px_rgba(9,3,22,0.45)]"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-black text-white">Pending amount</span>
                          <Clock className="w-4 h-4 text-amber-300" />
                        </div>
                        <div className="text-lg font-black text-amber-300 mt-1">
                          {formatSamplePts(summary.pendingEarningsPts)} pts
                        </div>
                        <p className="text-[11px] text-purple-200/70 mt-0.5">
                          Awaiting sample processing
                        </p>
                      </button>
                    </div>
                  </section>

                  {/* Interactive Earnings Chart */}
                  <AgentEarningsCharts
                    chartMode={chartMode}
                    onChartModeChange={setChartMode}
                  />

                  {/* Recent Activity / Transaction History with Date Filters, Search & Sort */}
                  <section className="space-y-3" data-testid="agent-recent-activity-section">
                    <div className="rounded-3xl bg-[#1A0B2E]/95 border border-purple-400/20 p-4 sm:p-5 space-y-3.5 shadow-[0_14px_38px_rgba(9,3,22,0.5)]">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div>
                          <h2 className="text-base font-black text-white">Recent activity</h2>
                          <p className="text-[11px] text-purple-200/75">
                            Transaction & earning history (Sample frontend entries only)
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setSortMode((prev) =>
                              prev === 'date_desc'
                                ? 'amount_desc'
                                : prev === 'amount_desc'
                                ? 'amount_asc'
                                : prev === 'amount_asc'
                                ? 'date_asc'
                                : 'date_desc'
                            )
                          }
                          data-testid="tx-sort-toggle"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#120624] border border-purple-400/25 text-[11px] font-bold text-purple-100 hover:border-[#FF2E93]/50 transition self-start sm:self-auto"
                        >
                          <ArrowUpDown className="w-3.5 h-3.5 text-[#FF6BA3]" />
                          {sortMode === 'date_desc'
                            ? 'Sort: Newest'
                            : sortMode === 'date_asc'
                            ? 'Sort: Oldest'
                            : sortMode === 'amount_desc'
                            ? 'Sort: Highest pts'
                            : 'Sort: Lowest pts'}
                        </button>
                      </div>

                      {/* Date Filter Pills */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {dateFilterButtons.map((btn) => {
                          const active = datePeriod === btn.id;
                          return (
                            <button
                              key={btn.id}
                              type="button"
                              onClick={() => handleDatePeriodChange(btn.id)}
                              data-testid={`date-filter-${btn.id}`}
                              className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition border ${
                                active
                                  ? 'bg-[#FF2E93] text-white border-[#FF2E93]'
                                  : 'bg-[#120624] text-purple-200/80 border-purple-400/20 hover:border-purple-300/40'
                              }`}
                            >
                              {btn.label}
                            </button>
                          );
                        })}
                      </div>

                      {datePeriod === 'custom' && (
                        <div className="grid grid-cols-2 gap-2.5 pt-1">
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-purple-300/70 mb-1">
                              From
                            </label>
                            <input
                              type="date"
                              value={customStartDate}
                              onChange={(e) => setCustomStartDate(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-[#120624] border border-purple-400/25 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-purple-300/70 mb-1">
                              To
                            </label>
                            <input
                              type="date"
                              value={customEndDate}
                              onChange={(e) => setCustomEndDate(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-[#120624] border border-purple-400/25 text-xs text-white"
                            />
                          </div>
                        </div>
                      )}

                      {/* Search & Status Filters */}
                      <div className="relative">
                        <Search className="w-4 h-4 text-purple-300/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={activitySearch}
                          onChange={(e) => setActivitySearch(e.target.value)}
                          data-testid="tx-search-input"
                          placeholder="Search by EARN ID, activity type, host, or ref..."
                          className="w-full pl-10 pr-9 py-2 rounded-full bg-[#120624] border border-purple-400/25 text-xs text-white placeholder:text-purple-300/45 focus:outline-none focus:border-[#FF2E93]"
                        />
                        {activitySearch && (
                          <button
                            type="button"
                            onClick={() => setActivitySearch('')}
                            aria-label="Clear search"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300/60 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {(['All', 'Completed', 'Pending', 'Processing'] as ActivityStatusFilter[]).map(
                          (st) => {
                            const active = activityStatusFilter === st;
                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={() => setActivityStatusFilter(st)}
                                data-testid={`tx-status-${st.toLowerCase()}`}
                                className={`px-3 py-1 rounded-full text-[11px] font-bold transition border ${
                                  active
                                    ? 'bg-purple-500/30 text-white border-purple-300/50'
                                    : 'bg-[#120624] text-purple-200/75 border-purple-400/15 hover:border-purple-300/35'
                                }`}
                              >
                                {st}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>

                    {records.length === 0 ? (
                      <AgentEmptyState kind="no_earnings" onAction={handleRestoreAllDemo} />
                    ) : filteredRecords.length === 0 ? (
                      activitySearch.trim() ? (
                        <AgentEmptyState
                          kind="no_search_results"
                          onAction={() => {
                            setActivitySearch('');
                            setActivityStatusFilter('All');
                            setDatePeriod('this_month');
                          }}
                        />
                      ) : activityStatusFilter === 'Pending' ? (
                        <AgentEmptyState
                          kind="no_pending"
                          onAction={() => {
                            setRecords(createInitialEarningRecords());
                            setActivityStatusFilter('All');
                          }}
                        />
                      ) : activityStatusFilter === 'Completed' ? (
                        <AgentEmptyState
                          kind="no_completed"
                          onAction={() => {
                            setRecords(createInitialEarningRecords());
                            setActivityStatusFilter('All');
                          }}
                        />
                      ) : (
                        <AgentEmptyState
                          kind="no_search_results"
                          onAction={() => {
                            setDatePeriod('this_month');
                            setActivityStatusFilter('All');
                          }}
                        />
                      )
                    ) : (
                      <div className="space-y-2.5" data-testid="agent-activity-list">
                        {filteredRecords.map((rec) => (
                          <button
                            key={rec.id}
                            type="button"
                            onClick={() => openEarningDetail(rec)}
                            data-testid={`earning-row-${rec.id}`}
                            className="w-full text-left rounded-2xl bg-[#1D0D34] hover:bg-[#261243] border border-purple-400/20 hover:border-[#FF2E93]/45 px-4 py-3.5 flex items-center justify-between gap-3 transition shadow-[0_8px_24px_rgba(9,3,22,0.4)]"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-black text-white truncate">
                                  {rec.title}
                                </span>
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold ${getEarningStatusPillStyle(
                                    rec.status
                                  )}`}
                                >
                                  {rec.status}
                                </span>
                              </div>
                              <div className="text-xs text-purple-200/75 mt-1 truncate">
                                {rec.dateLabel} · {rec.hostName} ·{' '}
                                <span className="font-mono text-[10px]">{rec.referenceCode}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`text-sm sm:text-base font-black ${
                                  rec.status === 'Cancelled'
                                    ? 'text-rose-300 line-through'
                                    : rec.status === 'Pending'
                                    ? 'text-amber-300'
                                    : 'text-emerald-300'
                                }`}
                              >
                                +{formatSamplePts(rec.sampleAmountPts)}
                              </span>
                              <ChevronRight className="w-4 h-4 text-purple-300/70" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              )}

              {activeTab === 'monthly' && (
                <section className="space-y-4" data-testid="monthly-pending-section">
                  <div className="rounded-3xl bg-[#1A0B2E]/95 border border-purple-400/20 p-5 space-y-4">
                    <h2 className="text-base font-black text-white">
                      Monthly, Pending & Completed Earnings (Sample)
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-[#120624]/85 border border-purple-400/15 p-4">
                        <div className="text-xs text-purple-200/75">This Month (Nov 2026)</div>
                        <div className="text-2xl font-black text-amber-300 mt-1">
                          {formatSamplePts(summary.thisMonthPts)} pts
                        </div>
                      </div>
                      <div className="rounded-2xl bg-[#120624]/85 border border-purple-400/15 p-4">
                        <div className="text-xs text-purple-200/75">Last Month (Oct 2026)</div>
                        <div className="text-2xl font-black text-white mt-1">
                          {formatSamplePts(summary.lastMonthPts)} pts
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pending Entries */}
                  <div className="rounded-3xl bg-[#1A0B2E]/95 border border-purple-400/20 p-5 space-y-3">
                    <h3 className="text-sm font-black text-amber-300">
                      Pending Earnings ({pendingOnlyRecords.length} entries)
                    </h3>
                    {pendingOnlyRecords.length === 0 ? (
                      <AgentEmptyState
                        kind="no_pending"
                        onAction={() => setRecords(createInitialEarningRecords())}
                      />
                    ) : (
                      <div className="space-y-2">
                        {pendingOnlyRecords.map((rec) => (
                          <button
                            key={rec.id}
                            type="button"
                            onClick={() => openEarningDetail(rec)}
                            className="w-full text-left rounded-2xl bg-[#120624]/85 hover:bg-white/5 border border-amber-400/20 px-4 py-3 flex items-center justify-between gap-2 transition"
                          >
                            <div>
                              <div className="text-xs font-bold text-white">
                                {rec.id} · {rec.hostName}
                              </div>
                              <div className="text-[11px] text-purple-200/70">
                                {rec.dateLabel} · {rec.referenceCode}
                              </div>
                            </div>
                            <span className="text-sm font-black text-amber-300">
                              +{formatSamplePts(rec.sampleAmountPts)} pts
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Completed Entries */}
                  <div className="rounded-3xl bg-[#1A0B2E]/95 border border-purple-400/20 p-5 space-y-3">
                    <h3 className="text-sm font-black text-emerald-300">
                      Completed Earnings ({completedOnlyRecords.length} entries)
                    </h3>
                    {completedOnlyRecords.length === 0 ? (
                      <AgentEmptyState
                        kind="no_completed"
                        onAction={() => setRecords(createInitialEarningRecords())}
                      />
                    ) : (
                      <div className="space-y-2">
                        {completedOnlyRecords.map((rec) => (
                          <button
                            key={rec.id}
                            type="button"
                            onClick={() => openEarningDetail(rec)}
                            className="w-full text-left rounded-2xl bg-[#120624]/85 hover:bg-white/5 border border-emerald-400/20 px-4 py-3 flex items-center justify-between gap-2 transition"
                          >
                            <div>
                              <div className="text-xs font-bold text-white">
                                {rec.id} · {rec.hostName}
                              </div>
                              <div className="text-[11px] text-purple-200/70">
                                {rec.dateLabel} · {rec.referenceCode}
                              </div>
                            </div>
                            <span className="text-sm font-black text-emerald-300">
                              +{formatSamplePts(rec.sampleAmountPts)} pts
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              )}

              {activeTab === 'commission' && (
                <CommissionHistorySection
                  records={commissions}
                  onInspectDetail={(payload) => {
                    setSelectedDetail(payload);
                    scrollToTop();
                  }}
                  onRestoreRecords={() => {
                    setCommissions(createInitialCommissionHistory());
                    setToastMessage('Demo commission history restored.');
                  }}
                />
              )}

              {activeTab === 'host_activity' && (
                <HostActivityEarningsSection
                  items={hostActivityItems}
                  onInspectDetail={(payload) => {
                    setSelectedDetail(payload);
                    scrollToTop();
                  }}
                  onRestoreItems={() => {
                    setHostActivityItems(createInitialHostActivityEarnings());
                    setToastMessage('Sample host activity earnings restored.');
                  }}
                />
              )}
            </div>

            {/* Right Sidebar */}
            <aside className="lg:col-span-4 space-y-4">
              <div className="rounded-3xl bg-[#1A0B2E]/95 border border-purple-400/20 p-5 space-y-3.5 shadow-[0_14px_38px_rgba(9,3,22,0.5)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-purple-200/80">
                    Summary Quick View
                  </span>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-200/75">Total Accumulated</span>
                    <span className="font-black text-white">
                      {formatSamplePts(summary.totalEarningsPts)} pts
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-200/75">This Month</span>
                    <span className="font-bold text-amber-300">
                      {formatSamplePts(summary.thisMonthPts)} pts
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-200/75">Last Month</span>
                    <span className="font-bold text-white">
                      {formatSamplePts(summary.lastMonthPts)} pts
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-200/75">Pending</span>
                    <span className="font-bold text-amber-300">
                      {formatSamplePts(summary.pendingEarningsPts)} pts
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-200/75">Completed</span>
                    <span className="font-bold text-emerald-300">
                      {formatSamplePts(summary.completedEarningsPts)} pts
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('commission');
                    scrollToTop();
                  }}
                  className="w-full py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-purple-400/25 text-xs font-bold text-white transition"
                >
                  Inspect Commission History →
                </button>
              </div>

              <div className="rounded-3xl bg-[#1A0B2E]/95 border border-purple-400/20 p-5 space-y-2.5">
                <div className="text-xs font-black uppercase tracking-wider text-purple-200/80 mb-1">
                  Related Creator Screens
                </div>
                <Link
                  href="/agency-management"
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#120624]/85 hover:bg-white/10 border border-purple-400/15 text-xs font-bold text-purple-100 transition"
                >
                  <span className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-[#FF6BA3]" />
                    Agency Management
                  </span>
                  <ChevronRight className="w-4 h-4 text-purple-300/60" />
                </Link>
                <Link
                  href="/earnings?preview=demo"
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#120624]/85 hover:bg-white/10 border border-purple-400/15 text-xs font-bold text-purple-100 transition"
                >
                  <span className="flex items-center gap-2">
                    <Coins className="w-3.5 h-3.5 text-amber-300" />
                    Host Gift Earnings
                  </span>
                  <ChevronRight className="w-4 h-4 text-purple-300/60" />
                </Link>
              </div>

              <div className="rounded-3xl bg-[#160929] border border-purple-400/15 p-4 flex items-start gap-2.5 text-[11px] text-purple-200/75 leading-relaxed">
                <Info className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <span>
                  Agent Earnings displays sample pts only. Real commission rules, conversion rates,
                  wallet modifications, and withdrawals are not connected.
                </span>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
};
