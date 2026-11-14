import React from 'react';
import {
  Users,
  UserCheck,
  Radio,
  ShieldAlert,
  Shield,
  Coins,
  Building2,
  Store,
  CreditCard,
  Layers,
  Newspaper,
  Bell,
  Clock,
  Search,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { DashboardEmptyKind } from './dashboardTypes';

interface DashboardEmptyStatesProps {
  kind: DashboardEmptyKind;
  onResetFilters?: () => void;
  customMessage?: string;
}

export const DashboardEmptyStates: React.FC<DashboardEmptyStatesProps> = ({
  kind,
  onResetFilters,
  customMessage,
}) => {
  const configs: Record<
    DashboardEmptyKind,
    {
      icon: React.ComponentType<{ className?: string }>;
      title: string;
      desc: string;
      color: string;
      actionText?: string;
    }
  > = {
    no_user_analytics: {
      icon: Users,
      title: 'No User Analytics Available',
      desc: 'There are no active or registered user statistics matching the selected date period.',
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      actionText: 'Reset Date Range',
    },
    no_host_analytics: {
      icon: UserCheck,
      title: 'No Host Records Found',
      desc: 'No host application or performance data recorded under the current criteria.',
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      actionText: 'View All Hosts',
    },
    no_live_sessions: {
      icon: Radio,
      title: 'No Active Live Sessions',
      desc: 'There are currently no ongoing broadcast rooms or live streams in this filter.',
      color: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
      actionText: 'Refresh Live Grid',
    },
    no_reports: {
      icon: ShieldAlert,
      title: 'No Moderation Reports',
      desc: 'Great news! There are zero unresolved harassment or policy reports in this queue.',
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      actionText: 'View Report History',
    },
    no_safety_cases: {
      icon: Shield,
      title: 'No Child Safety Incidents',
      desc: 'All age gates and biometric audits are verified. Zero active child protection alerts.',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      actionText: 'View Safety Logs',
    },
    no_economy_activity: {
      icon: Coins,
      title: 'No Economy Transactions',
      desc: 'No coin purchases or virtual gift transactions recorded for this period.',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      actionText: 'Reset Period',
    },
    no_agencies: {
      icon: Building2,
      title: 'No Agencies Registered',
      desc: 'No talent agency organizations match the selected filters or search terms.',
      color: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
      actionText: 'View All Agencies',
    },
    no_sellers: {
      icon: Store,
      title: 'No Authorized Sellers Found',
      desc: 'No coin sellers or regional distributor accounts match your selection.',
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      actionText: 'View Sellers',
    },
    no_payout_requests: {
      icon: CreditCard,
      title: 'No Pending Payout Requests',
      desc: 'All host and seller payout disbursements have been processed and cleared.',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      actionText: 'View Payout Archive',
    },
    no_content_records: {
      icon: Layers,
      title: 'No Content Items Configured',
      desc: 'There are no active gifts, avatars, or virtual store packages in this catalog.',
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      actionText: 'Open Store Catalog',
    },
    no_news_articles: {
      icon: Newspaper,
      title: 'No News Announcements',
      desc: 'No published or scheduled news announcements registered for this view.',
      color: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
      actionText: 'Create Article',
    },
    no_notification_campaigns: {
      icon: Bell,
      title: 'No Push Campaigns Found',
      desc: 'There are no notification campaigns matching the active status filter.',
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      actionText: 'View Campaigns',
    },
    no_platform_activity: {
      icon: Clock,
      title: 'No Recent Platform Activity',
      desc: 'No cross-module system events or admin actions found in this timeframe.',
      color: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
      actionText: 'Reset Filters',
    },
    no_search_results: {
      icon: Search,
      title: 'No Matching Platform Records',
      desc: 'No User, Host, Report, Agency, Seller, Payout, or Campaign matched your query.',
      color: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
      actionText: 'Clear Search',
    },
  };

  const current = configs[kind] || {
    icon: AlertCircle,
    title: 'No Data Found',
    desc: 'No records available to display.',
    color: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
    actionText: 'Reset',
  };

  const Icon = current.icon;

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-[#130728]/70 border border-purple-500/20 rounded-2xl my-4 backdrop-blur-md">
      <div className={`p-4 rounded-2xl border mb-3.5 shadow-lg ${current.color}`}>
        <Icon className="w-9 h-9" />
      </div>
      <h3 className="text-lg font-bold text-white mb-1.5">{current.title}</h3>
      <p className="text-purple-300/80 max-w-md text-xs mb-5 leading-relaxed">
        {customMessage || current.desc}
      </p>
      {onResetFilters && current.actionText && (
        <button
          onClick={onResetFilters}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium text-xs hover:from-pink-600 hover:to-purple-700 transition shadow-lg shadow-pink-500/20 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{current.actionText}</span>
        </button>
      )}
    </div>
  );
};
