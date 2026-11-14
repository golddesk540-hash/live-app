'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Clock,
  Download,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Activity,
  Layers,
  ArrowRight,
  Filter,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Zap,
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react';
import {
  DateRangeOption,
  DashboardViewTab,
  CustomDateRange
} from './dashboardTypes';
import {
  getMetricsForDateRange,
  INITIAL_PLATFORM_ACTIVITIES,
  INITIAL_ADMIN_ACTIONS,
} from './mockDashboardData';
import { ExecutiveHeroCards } from './ExecutiveHeroCards';
import { VisualAnalyticsCharts } from './VisualAnalyticsCharts';
import { DetailedAnalyticsSections } from './DetailedAnalyticsSections';
import { PlatformActivityTimeline } from './PlatformActivityTimeline';
import { RecentAdminActionsView } from './RecentAdminActionsView';
import { QuickNavigationGrid } from './QuickNavigationGrid';
import { CustomDateRangeModal } from './CustomDateRangeModal';
import { DashboardEmptyStates } from './DashboardEmptyStates';

interface MainAdminDashboardModuleProps {
  onNavigateSection?: (sectionKey: string) => void;
}

export const MainAdminDashboardModule: React.FC<MainAdminDashboardModuleProps> = ({
  onNavigateSection = () => {}
}) => {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<DashboardViewTab>('overview');
  const [dateRange, setDateRange] = useState<DateRangeOption>('7d');
  const [customRange, setCustomRange] = useState<CustomDateRange>({
    startDate: '2026-11-01',
    endDate: '2026-11-14'
  });
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamic Metrics based on selected date range
  const metrics = useMemo(() => {
    const customDays = customRange
      ? Math.max(1, Math.round((new Date(customRange.endDate).getTime() - new Date(customRange.startDate).getTime()) / (1000 * 3600 * 24)))
      : 14;
    return getMetricsForDateRange(dateRange, customDays);
  }, [dateRange, customRange]);

  // Show Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Refresh Handler
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Dashboard metrics refreshed with live platform telemetry.');
    }, 600);
  };

  // Export Handler
  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(metrics, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `popo-live-dashboard-${dateRange}-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Platform metrics exported to JSON successfully.');
  };

  // Global ID Search Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();

    const matches: Array<{
      id: string;
      type: string;
      label: string;
      section: string;
      detail: string;
    }> = [];

    // Check Mock Activities
    INITIAL_PLATFORM_ACTIVITIES.forEach(a => {
      if (
        a.id.toLowerCase().includes(q) ||
        a.relatedRecordId.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
      ) {
        matches.push({
          id: a.relatedRecordId || a.id,
          type: a.module,
          label: a.title,
          section:
            a.module === 'Users' ? 'users' :
            a.module === 'Hosts' ? 'hosts' :
            a.module === 'Live' ? 'live_monitor' :
            a.module === 'Safety' ? 'safety' :
            a.module === 'Reports' ? 'reports' :
            a.module === 'Economy' ? 'economy' :
            a.module === 'Payouts' || a.module === 'Agencies' || a.module === 'Sellers' ? 'agency' : 'news',
          detail: a.description
        });
      }
    });

    // Check Mock Admin Actions
    INITIAL_ADMIN_ACTIONS.forEach(act => {
      if (
        act.id.toLowerCase().includes(q) ||
        act.targetId.toLowerCase().includes(q) ||
        act.actionType.toLowerCase().includes(q) ||
        act.adminName.toLowerCase().includes(q)
      ) {
        matches.push({
          id: act.targetId,
          type: act.module,
          label: `${act.adminName}: ${act.actionType}`,
          section:
            act.module.includes('User') ? 'users' :
            act.module.includes('Live') ? 'live_monitor' :
            act.module.includes('Report') ? 'reports' :
            act.module.includes('Safety') ? 'safety' :
            act.module.includes('Economy') ? 'economy' :
            act.module.includes('Agency') || act.module.includes('Payout') ? 'agency' :
            act.module.includes('News') || act.module.includes('Push') ? 'news' : 'roles',
          detail: act.description
        });
      }
    });

    return matches.slice(0, 6);
  }, [searchQuery]);

  return (
    <div className="w-full space-y-6 pb-16 animate-fade-in text-white">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-2xl shadow-pink-500/30 border border-pink-400/30 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* TOP EXECUTIVE BANNER & HEADER */}
      <div className="bg-gradient-to-r from-[#170836] via-[#120726] to-[#1c0840] border border-purple-800/50 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Platform Title & Badge */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-pink-500/20 text-pink-300 border border-pink-500/40 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                Popo Live v10.9
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Executive Platform Analytics
              </span>
              <span className="text-xs text-purple-300/60 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Live Sync: UTC 14 Nov 2026
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Main Admin Dashboard
              <span className="text-pink-500 text-lg font-normal">&bull; Platform Overview</span>
            </h1>
            <p className="text-xs sm:text-sm text-purple-300/80 max-w-2xl">
              Centralized platform operations, real-time user metrics, live stream concurrency, trust & safety queues, virtual economy velocity, and administrative audit trails.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3.5 py-2 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700/50 text-purple-200 text-xs font-semibold flex items-center gap-2 transition-all hover:text-white"
              title="Refresh platform telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-pink-400' : ''}`} />
              <span>Refresh Stats</span>
            </button>
            <button
              onClick={handleExport}
              className="px-3.5 py-2 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700/50 text-purple-200 text-xs font-semibold flex items-center gap-2 transition-all hover:text-white"
              title="Export current metrics to JSON"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export Report</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('quick_nav');
                showToast('Switched to Quick Navigation Grid.');
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-xs font-bold shadow-lg shadow-pink-500/20 flex items-center gap-1.5 transition-all"
            >
              <Layers className="w-4 h-4" />
              <span>Module Directory</span>
            </button>
          </div>
        </div>

        {/* Global Date Filter Strip */}
        <div className="relative z-10 mt-6 pt-5 border-t border-purple-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
            <Calendar className="w-4 h-4 text-pink-400" />
            <span>Time Range:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-purple-900/50">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
              { id: '90d', label: 'Last 90 Days' },
              { id: 'custom', label: dateRange === 'custom' ? `Custom: ${customRange.startDate}` : 'Custom Range...' }
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => {
                  if (opt.id === 'custom') {
                    setIsCustomModalOpen(true);
                  } else {
                    setDateRange(opt.id as DateRangeOption);
                    showToast(`Metrics filtered to ${opt.label}.`);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  dateRange === opt.id
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/25'
                    : 'text-purple-300/80 hover:text-white hover:bg-white/5'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TOP VIEW NAVIGATION PILLS (Matching 10_09_dashboard.png [Overview] [Growth] [Revenue]) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#120726]/90 p-2.5 rounded-2xl border border-purple-900/50 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'growth', label: 'Growth' },
            { id: 'economy', label: 'Economy' },
            { id: 'analytics_hub', label: 'Analytics Hub' },
            { id: 'activity', label: 'Platform Activity' },
            { id: 'quick_nav', label: 'Quick Nav' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as DashboardViewTab)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/25'
                  : 'text-purple-300/80 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Global Entity Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search User, Host, Report, Payout ID..."
            className="w-full bg-black/40 border border-purple-900/60 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-purple-400/50 focus:outline-none focus:border-pink-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-purple-400 hover:text-white text-xs"
            >
              &times;
            </button>
          )}

          {/* Search Results Dropdown */}
          {searchResults && searchResults.length > 0 && (
            <div className="absolute top-full mt-2 left-0 right-0 z-50 bg-[#160830] border border-purple-800 rounded-2xl shadow-2xl p-2 space-y-1">
              <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider px-2 py-1">
                Matching Records ({searchResults.length})
              </div>
              {searchResults.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSearchQuery('');
                    onNavigateSection(item.section);
                  }}
                  className="p-2 rounded-xl hover:bg-purple-900/40 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">{item.id}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 font-semibold uppercase">
                        {item.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-purple-300/70 truncate max-w-[220px]">
                      {item.label}
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CONDITIONAL VIEW RENDERING */}

      {/* VIEW 1: OVERVIEW (Default matching 10_09_dashboard.png) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Section 4: 4 Hero Cards matching 10_09_dashboard.png + secondary KPI strip */}
          <ExecutiveHeroCards metrics={metrics} onNavigateSection={onNavigateSection} />

          {/* Primary Visual Analytics Chart Strip (Mon-Sun Bar Chart) */}
          <VisualAnalyticsCharts dateRange={dateRange} />

          {/* Detailed Domain Analytics Highlights */}
          <DetailedAnalyticsSections metrics={metrics} onNavigateSection={onNavigateSection} />

          {/* Quick Nav 8 Modules */}
          <QuickNavigationGrid onNavigateSection={onNavigateSection} />

          {/* Dual Feed: Recent Platform Activities + Staff Action Audits */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PlatformActivityTimeline
              activities={INITIAL_PLATFORM_ACTIVITIES}
              onNavigateModule={onNavigateSection}
            />
            <RecentAdminActionsView
              actions={INITIAL_ADMIN_ACTIONS}
              onNavigateModule={onNavigateSection}
            />
          </div>
        </div>
      )}

      {/* VIEW 2: GROWTH (User, Host and Registrations) */}
      {activeTab === 'growth' && (
        <div className="space-y-6">
          <ExecutiveHeroCards metrics={metrics} onNavigateSection={onNavigateSection} />
          <VisualAnalyticsCharts dateRange={dateRange} />
          <DetailedAnalyticsSections metrics={metrics} onNavigateSection={onNavigateSection} />
        </div>
      )}

      {/* VIEW 3: ECONOMY (Coins, Store, Payouts, Settlement) */}
      {activeTab === 'economy' && (
        <div className="space-y-6">
          <DetailedAnalyticsSections metrics={metrics} onNavigateSection={onNavigateSection} />
          <VisualAnalyticsCharts dateRange={dateRange} />
        </div>
      )}

      {/* VIEW 4: ANALYTICS HUB (All 12 Charts and Domain Panels) */}
      {activeTab === 'analytics_hub' && (
        <div className="space-y-6">
          <VisualAnalyticsCharts dateRange={dateRange} />
          <DetailedAnalyticsSections metrics={metrics} onNavigateSection={onNavigateSection} />
        </div>
      )}

      {/* VIEW 5: PLATFORM ACTIVITY (Full Audit & Timeline Logs) */}
      {activeTab === 'activity' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PlatformActivityTimeline
              activities={INITIAL_PLATFORM_ACTIVITIES}
              onNavigateModule={onNavigateSection}
            />
            <RecentAdminActionsView
              actions={INITIAL_ADMIN_ACTIONS}
              onNavigateModule={onNavigateSection}
            />
          </div>
        </div>
      )}

      {/* VIEW 6: QUICK NAV (Interactive Directory of All Modules 10.1 to 10.8) */}
      {activeTab === 'quick_nav' && (
        <div className="space-y-6">
          <QuickNavigationGrid onNavigateSection={onNavigateSection} />
          <DetailedAnalyticsSections metrics={metrics} onNavigateSection={onNavigateSection} />
        </div>
      )}

      {/* CUSTOM DATE RANGE MODAL */}
      <CustomDateRangeModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        initialStart={customRange.startDate}
        initialEnd={customRange.endDate}
        onApply={(start, end) => {
          setCustomRange({ startDate: start, endDate: end });
          setDateRange('custom');
          showToast(`Custom date range applied: ${start} to ${end}.`);
        }}
      />
    </div>
  );
};
