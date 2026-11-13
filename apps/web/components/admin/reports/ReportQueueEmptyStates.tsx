'use client';

import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileSearch,
  FilterX,
  Inbox,
  Search,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

export type ReportEmptyStateType =
  | 'no_reports'
  | 'no_pending_reports'
  | 'no_review_reports'
  | 'no_resolved_reports'
  | 'no_rejected_reports'
  | 'no_category_reports'
  | 'no_search_results'
  | 'no_evidence'
  | 'no_activity';

interface ReportQueueEmptyStatesProps {
  type: ReportEmptyStateType;
  customMessage?: string;
  onResetFilters?: () => void;
  onRefresh?: () => void;
}

export const ReportQueueEmptyStates: React.FC<ReportQueueEmptyStatesProps> = ({
  type,
  customMessage,
  onResetFilters,
  onRefresh,
}) => {
  const configMap: Record<
    ReportEmptyStateType,
    {
      icon: React.ComponentType<{ className?: string }>;
      title: string;
      desc: string;
      iconColor: string;
      iconBg: string;
      actionText?: string;
      onAction?: () => void;
    }
  > = {
    no_reports: {
      icon: ShieldCheck,
      title: 'No Reports in Queue',
      desc: 'The report queue is currently clean. All community complaints have been processed.',
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]',
      actionText: 'Refresh Queue',
      onAction: onRefresh,
    },
    no_pending_reports: {
      icon: CheckCircle2,
      title: 'Zero Pending Reports',
      desc: 'Great job! There are no unassigned or awaiting reports right now.',
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.15)]',
      actionText: 'View All Reports',
      onAction: onResetFilters,
    },
    no_review_reports: {
      icon: Inbox,
      title: 'No Active Reviews',
      desc: 'No reports are currently placed under active investigation by moderators.',
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10 border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.15)]',
      actionText: 'Check Pending Queue',
      onAction: onResetFilters,
    },
    no_resolved_reports: {
      icon: FileSearch,
      title: 'No Resolved Reports',
      desc: 'No completed or closed resolution cases recorded in this filtered period.',
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10 border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]',
      actionText: 'Reset Filters',
      onAction: onResetFilters,
    },
    no_rejected_reports: {
      icon: XCircle,
      title: 'No Rejected Reports',
      desc: 'No dismissed or unsubstantiated reports found matching your selection.',
      iconColor: 'text-rose-400',
      iconBg: 'bg-rose-500/10 border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.15)]',
      actionText: 'Reset Filters',
      onAction: onResetFilters,
    },
    no_category_reports: {
      icon: FilterX,
      title: 'No Reports In Category',
      desc: 'There are no active report records matching the selected safety category.',
      iconColor: 'text-pink-400',
      iconBg: 'bg-pink-500/10 border-pink-500/20 shadow-[0_0_20px_rgba(255,15,123,0.15)]',
      actionText: 'Clear Category Filter',
      onAction: onResetFilters,
    },
    no_search_results: {
      icon: Search,
      title: 'No Search Matches Found',
      desc: 'No report records match your query. Check Report ID, reporter username, or account ID.',
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.15)]',
      actionText: 'Clear Search Query',
      onAction: onResetFilters,
    },
    no_evidence: {
      icon: AlertCircle,
      title: 'No Evidence Attached',
      desc: 'The reporter did not upload screenshots, screen captures, or media files with this report.',
      iconColor: 'text-gray-400',
      iconBg: 'bg-white/5 border-white/10',
    },
    no_activity: {
      icon: ShieldAlert,
      title: 'No Audit Activity Logged',
      desc: 'No timeline events recorded yet for this moderation record.',
      iconColor: 'text-gray-400',
      iconBg: 'bg-white/5 border-white/10',
    },
  };

  const item = configMap[type];
  const Icon = item.icon;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-sm">
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center border mb-4 transition-transform duration-300 hover:scale-105 ${item.iconBg}`}
      >
        <Icon className={`w-7 h-7 ${item.iconColor}`} />
      </div>

      <h3 className="text-lg font-bold text-white mb-1.5">{item.title}</h3>

      <p className="text-sm text-gray-400 max-w-md mb-6 leading-relaxed">
        {customMessage || item.desc}
      </p>

      {item.actionText && item.onAction && (
        <button
          onClick={item.onAction}
          className="px-5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/20 hover:border-pink-500/40 transition-all duration-200 active:scale-95"
        >
          {item.actionText}
        </button>
      )}
    </div>
  );
};
