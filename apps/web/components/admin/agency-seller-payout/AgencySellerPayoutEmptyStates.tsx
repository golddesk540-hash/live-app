import React from 'react';
import {
  Building2,
  Store,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Search,
  AlertCircle,
} from 'lucide-react';
import { AgencySellerPayoutEmptyKind } from './agencySellerPayoutTypes';

interface AgencySellerPayoutEmptyStateProps {
  kind: AgencySellerPayoutEmptyKind;
  onResetFilters?: () => void;
  customMessage?: string;
}

export const AgencySellerPayoutEmptyStates: React.FC<AgencySellerPayoutEmptyStateProps> = ({
  kind,
  onResetFilters,
  customMessage,
}) => {
  const configs: Record<
    AgencySellerPayoutEmptyKind,
    {
      icon: React.ComponentType<{ className?: string }>;
      title: string;
      desc: string;
      color: string;
      actionText?: string;
    }
  > = {
    no_agencies: {
      icon: Building2,
      title: 'No Agencies Registered',
      desc: 'No agency guild profiles match the current filter criteria.',
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      actionText: 'Clear Agency Filters',
    },
    no_sellers: {
      icon: Store,
      title: 'No Coin Sellers Found',
      desc: 'There are no active or pending coin seller accounts matching your selection.',
      color: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
      actionText: 'Clear Seller Filters',
    },
    no_payout_requests: {
      icon: CreditCard,
      title: 'No Payout Requests Available',
      desc: 'No demo payout disbursement requests found in the current pipeline.',
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      actionText: 'View All Requests',
    },
    no_pending_payouts: {
      icon: Clock,
      title: 'No Pending Payouts',
      desc: 'All submitted demo payout requests have been reviewed or processed.',
      color: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
      actionText: 'Show All Payouts',
    },
    no_approved_payouts: {
      icon: CheckCircle2,
      title: 'No Approved Payouts',
      desc: 'There are currently no demo payouts waiting in the approved settlement queue.',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      actionText: 'Clear Filters',
    },
    no_completed_payouts: {
      icon: CheckCircle2,
      title: 'No Completed Payouts',
      desc: 'No demo payout records have been marked as completed in this view.',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      actionText: 'Reset View',
    },
    no_rejected_payouts: {
      icon: XCircle,
      title: 'No Rejected Payouts',
      desc: 'No payout requests have been rejected under the selected criteria.',
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      actionText: 'View All Records',
    },
    no_financial_activity: {
      icon: TrendingUp,
      title: 'No Financial Activity Recorded',
      desc: 'No transaction activity logs recorded for the selected timeframe.',
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      actionText: 'Reset Timeframe',
    },
    no_search_results: {
      icon: Search,
      title: 'No Matching Results',
      desc: 'No records found matching your current search query or active filter settings.',
      color: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
      actionText: 'Clear Search & Filters',
    },
  };

  const current = configs[kind] || {
    icon: AlertCircle,
    title: 'No Data Found',
    desc: 'There are no records to display.',
    color: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
    actionText: 'Clear Filters',
  };

  const Icon = current.icon;

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-[#130728]/70 border border-purple-500/20 rounded-2xl my-6 backdrop-blur-md">
      <div className={`p-4 rounded-2xl border mb-4 shadow-lg ${current.color}`}>
        <Icon className="w-10 h-10" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{current.title}</h3>
      <p className="text-purple-300/80 max-w-md text-sm mb-6 leading-relaxed">
        {customMessage || current.desc}
      </p>
      {onResetFilters && current.actionText && (
        <button
          onClick={onResetFilters}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium text-sm hover:from-pink-600 hover:to-purple-700 transition shadow-lg shadow-pink-500/20 cursor-pointer"
        >
          {current.actionText}
        </button>
      )}
    </div>
  );
};
