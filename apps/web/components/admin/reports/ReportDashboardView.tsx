'use client';

import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BadgeAlert,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Filter,
  HelpCircle,
  ImageOff,
  Inbox,
  MegaphoneOff,
  MessageSquareWarning,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  UserX,
  XCircle,
} from 'lucide-react';
import {
  REPORT_CATEGORIES,
} from './mockReportQueueData';
import {
  ReportCategoryKey,
  ReportNavTab,
  ReportQueueMetrics,
  ReportRecord,
  ReportStatus,
} from './reportQueueTypes';

interface ReportDashboardViewProps {
  metrics: ReportQueueMetrics;
  recentReports: ReportRecord[];
  activeTab: ReportNavTab;
  onTabChange: (tab: ReportNavTab) => void;
  onSelectCategory: (category: ReportCategoryKey) => void;
  onSelectReport: (report: ReportRecord) => void;
  onOpenReviewModal: (report: ReportRecord) => void;
  onRefresh: () => void;
}

export const ReportDashboardView: React.FC<ReportDashboardViewProps> = ({
  metrics,
  recentReports,
  activeTab,
  onTabChange,
  onSelectCategory,
  onSelectReport,
  onOpenReviewModal,
  onRefresh,
}) => {
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'ImageOff':
        return ImageOff;
      case 'ShieldAlert':
        return ShieldAlert;
      case 'MessageSquareWarning':
        return MessageSquareWarning;
      case 'MegaphoneOff':
        return MegaphoneOff;
      case 'UserX':
        return UserX;
      case 'BadgeAlert':
        return BadgeAlert;
      case 'AlertTriangle':
        return AlertTriangle;
      default:
        return HelpCircle;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Header & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_8px_#FF0F7B]" />
            <span className="text-xs font-bold tracking-wider uppercase text-pink-400">
              Community Trust & Safety
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Report Queue
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
              Module 10.4
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-xl">
            Live moderation pipeline, community complaint triaging, evidence auditing, and disposition management.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 hover:border-pink-500/40 transition-all active:scale-95"
            title="Refresh Report Queue"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => onTabChange('all')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-[0_0_20px_rgba(255,15,123,0.35)] transition-all active:scale-95"
          >
            <span>View All Reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Reports */}
        <div
          onClick={() => onTabChange('all')}
          className="cursor-pointer p-4 rounded-2xl bg-gradient-to-br from-[#1A103C] to-[#120A2A] border border-white/10 hover:border-pink-500/40 transition-all duration-300 group hover:shadow-[0_0_25px_rgba(255,15,123,0.2)]"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400">Total Reports</span>
            <div className="w-8 h-8 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {metrics.totalReports}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-pink-400">
            <TrendingUp className="w-3 h-3" />
            <span>+{metrics.newReportsToday} received today</span>
          </div>
        </div>

        {/* Pending Reports */}
        <div
          onClick={() => onTabChange('pending')}
          className="cursor-pointer p-4 rounded-2xl bg-gradient-to-br from-[#1A103C] to-[#120A2A] border border-amber-500/20 hover:border-amber-500/50 transition-all duration-300 group hover:shadow-[0_0_25px_rgba(245,158,11,0.2)]"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-300">Pending Triage</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {metrics.pendingReports}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-amber-400">
            <span>Awaiting initial review</span>
          </div>
        </div>

        {/* Under Review Reports */}
        <div
          onClick={() => onTabChange('review')}
          className="cursor-pointer p-4 rounded-2xl bg-gradient-to-br from-[#1A103C] to-[#120A2A] border border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 group hover:shadow-[0_0_25px_rgba(168,85,247,0.2)]"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-purple-300">Under Review</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {metrics.underReviewReports}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-purple-400">
            <span>Active moderation</span>
          </div>
        </div>

        {/* Resolved Reports */}
        <div
          onClick={() => onTabChange('resolved')}
          className="cursor-pointer p-4 rounded-2xl bg-gradient-to-br from-[#1A103C] to-[#120A2A] border border-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300 group hover:shadow-[0_0_25px_rgba(16,185,129,0.2)]"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-300">Resolved</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {metrics.resolvedReports}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-400">
            <span>Enforcement logged</span>
          </div>
        </div>

        {/* Rejected Reports */}
        <div
          onClick={() => onTabChange('rejected')}
          className="cursor-pointer p-4 rounded-2xl bg-gradient-to-br from-[#1A103C] to-[#120A2A] border border-rose-500/20 hover:border-rose-500/50 transition-all duration-300 group hover:shadow-[0_0_25px_rgba(244,63,94,0.2)] col-span-2 lg:col-span-1"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-rose-300">Rejected</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {metrics.rejectedReports}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-rose-400">
            <span>Dismissed as invalid</span>
          </div>
        </div>
      </div>

      {/* 3. Section 5: Category Summary Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-pink-400" />
              Report Categories
            </h2>
            <p className="text-xs text-gray-400">
              Distribution of incoming reports by policy infraction classification
            </p>
          </div>
          <button
            onClick={() => onTabChange('categories')}
            className="text-xs text-pink-400 hover:text-pink-300 font-semibold"
          >
            Manage Categories →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {REPORT_CATEGORIES.map((cat) => {
            const Icon = getCategoryIcon(cat.iconName);
            return (
              <div
                key={cat.key}
                onClick={() => onSelectCategory(cat.key)}
                className="cursor-pointer p-4 rounded-xl bg-[#1A103C]/80 border border-white/10 hover:border-pink-500/40 hover:bg-[#241452] transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 group-hover:scale-105 transition-transform">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${cat.badgeColor}`}>
                    {cat.reportCount}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors">
                  {cat.label}
                </h3>
                <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-snug">
                  {cat.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Recent Reports Stream (Visual Reference 10_04 Card Style) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
              Recent Incoming Reports
            </h2>
            <p className="text-xs text-gray-400">
              Latest items submitted through in-room and direct user report menus
            </p>
          </div>
          <button
            onClick={() => onTabChange('all')}
            className="text-xs text-pink-400 hover:text-pink-300 font-semibold"
          >
            View Full Table →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {recentReports.slice(0, 6).map((report) => {
            const isPending = report.status === 'Pending';
            const isReview = report.status === 'Under Review';
            const isResolved = report.status === 'Resolved';

            return (
              <div
                key={report.id}
                className="p-4 rounded-2xl bg-gradient-to-br from-[#1A103C] to-[#120A2A] border border-white/10 hover:border-pink-500/40 transition-all duration-300 shadow-md group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-white group-hover:text-pink-300 transition-colors">
                      Report {report.id}
                    </span>
                    <span className="text-[11px] text-gray-400">{report.submittedRelative}</span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative shrink-0">
                      <img
                        src={report.reported.avatar}
                        alt={report.reported.username}
                        className="w-12 h-12 rounded-xl object-cover border border-white/15 group-hover:scale-105 transition-transform"
                      />
                      {report.reported.isHost && (
                        <span className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-gradient-to-r from-pink-500 to-purple-600 rounded text-[9px] font-bold text-white uppercase">
                          Host
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-white truncate">
                          {report.reported.username}
                        </div>
                        {/* Status Badge styled exactly like 10_04 */}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isPending
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                              : isReview
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                              : isResolved
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {report.status}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-pink-400 mt-0.5 truncate">
                        {report.categoryLabel}
                      </p>
                      <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                        {report.shortDescription}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                  <span className="text-gray-400">
                    By: <strong className="text-gray-300">{report.reporter.username}</strong>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onSelectReport(report)}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => onOpenReviewModal(report)}
                      className="px-2.5 py-1 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 font-semibold transition-colors"
                    >
                      Review
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
