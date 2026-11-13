'use client';

import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  FileCheck,
  FileSearch,
  FilterX,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

export type ChildSafetyEmptyStateType =
  | 'no_alerts'
  | 'no_pending'
  | 'no_urgent'
  | 'no_escalated'
  | 'no_age_reviews'
  | 'no_evidence'
  | 'no_search_results'
  | 'no_activity';

interface ChildSafetyEmptyStatesProps {
  type: ChildSafetyEmptyStateType;
  customMessage?: string;
  onResetFilters?: () => void;
  onRefresh?: () => void;
}

export const ChildSafetyEmptyStates: React.FC<ChildSafetyEmptyStatesProps> = ({
  type,
  customMessage,
  onResetFilters,
  onRefresh,
}) => {
  const configMap: Record<
    ChildSafetyEmptyStateType,
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
    no_alerts: {
      icon: ShieldCheck,
      title: 'Zero Safety Alerts',
      desc: 'All automatic and community safety alerts have been triaged and resolved.',
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]',
      actionText: 'Refresh Alerts',
      onAction: onRefresh,
    },
    no_pending: {
      icon: CheckCircle2,
      title: 'No Pending Safety Cases',
      desc: 'Great work! The child safety triage backlog is clean with zero unassigned cases.',
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]',
      actionText: 'View All Cases',
      onAction: onResetFilters,
    },
    no_urgent: {
      icon: ShieldCheck,
      title: 'No Urgent Priority Incidents',
      desc: 'There are no active urgent safety violations requiring emergency intervention.',
      iconColor: 'text-pink-400',
      iconBg: 'bg-pink-500/10 border-pink-500/20 shadow-[0_0_20px_rgba(255,15,123,0.15)]',
      actionText: 'Reset Filters',
      onAction: onResetFilters,
    },
    no_escalated: {
      icon: ArrowUpRight,
      title: 'No Escalated Cases',
      desc: 'No cases are currently flagged for Senior Safety Lead or Executive review.',
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10 border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.15)]',
      actionText: 'Reset Filters',
      onAction: onResetFilters,
    },
    no_age_reviews: {
      icon: UserCheck,
      title: 'Age Review Queue Clear',
      desc: 'All broadcaster KYC age verifications have been processed and certified.',
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10 border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]',
      actionText: 'Check Back Later',
      onAction: onRefresh,
    },
    no_evidence: {
      icon: FileCheck,
      title: 'No Evidence Records Attached',
      desc: 'This safety incident does not contain visual attachments or chat transcript excerpts.',
      iconColor: 'text-gray-400',
      iconBg: 'bg-white/5 border-white/10',
    },
    no_search_results: {
      icon: Search,
      title: 'No Safety Matches Found',
      desc: 'No safety cases or alerts matched your query. Check Case ID, Report ID, or username.',
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.15)]',
      actionText: 'Clear Search Filters',
      onAction: onResetFilters,
    },
    no_activity: {
      icon: ShieldAlert,
      title: 'No Safety Activity Logged',
      desc: 'No audit events or disposition changes recorded yet for this safety file.',
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

      <h3 className="text-base font-bold text-white mb-1.5">{item.title}</h3>

      <p className="text-xs text-gray-400 max-w-md mb-6 leading-relaxed">
        {customMessage || item.desc}
      </p>

      {item.actionText && item.onAction && (
        <button
          onClick={item.onAction}
          className="px-5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/20 hover:border-pink-500/40 transition-all active:scale-95"
        >
          {item.actionText}
        </button>
      )}
    </div>
  );
};
