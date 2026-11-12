'use client';

import React from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  Coins,
  FileSpreadsheet,
  SearchX,
  XCircle,
} from 'lucide-react';
import { SellerEmptyKind } from './types';

interface SellerEmptyStateProps {
  kind: SellerEmptyKind;
  onReset?: () => void;
  resetLabel?: string;
}

const EMPTY_CONFIG: Record<
  SellerEmptyKind,
  {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  no_sales: {
    title: 'No Sales Records Available',
    description: 'Sample coin sales records for this view or filter will appear once added.',
    icon: FileSpreadsheet,
  },
  no_orders: {
    title: 'No Demo Orders Yet',
    description: 'Incoming demo coin package orders for this seller account will appear here.',
    icon: Coins,
  },
  no_pending_orders: {
    title: 'No Pending Orders',
    description: 'All pending demo coin orders in the seller queue have been processed.',
    icon: Clock,
  },
  no_completed_orders: {
    title: 'No Completed Orders',
    description: 'Completed demo coin package orders will be listed here once finalized.',
    icon: CheckCircle2,
  },
  no_cancelled_orders: {
    title: 'No Cancelled Orders',
    description: 'Cancelled demo orders are currently empty for this filter.',
    icon: XCircle,
  },
  no_search_results: {
    title: 'No Matching Records Found',
    description: 'No orders or sales records matched your search query or selected date range.',
    icon: SearchX,
  },
  no_seller_activity: {
    title: 'No Seller Activity Logged',
    description: 'Recent demo order status changes and sales updates will appear here.',
    icon: Activity,
  },
};

export const SellerEmptyState: React.FC<SellerEmptyStateProps> = ({
  kind,
  onReset,
  resetLabel = 'Restore Sample Records',
}) => {
  const cfg = EMPTY_CONFIG[kind];
  const Icon = cfg.icon;

  return (
    <div
      data-testid={`seller-empty-${kind}`}
      className="rounded-3xl bg-[#1A0E33]/90 border border-purple-500/25 p-8 text-center shadow-lg"
    >
      <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 via-purple-500/20 to-pink-500/20 border border-amber-400/30 flex items-center justify-center">
        <Icon className="w-7 h-7 text-amber-300" />
      </div>
      <h3 className="text-base font-bold text-white mb-1.5">{cfg.title}</h3>
      <p className="text-sm text-purple-200/75 max-w-md mx-auto">{cfg.description}</p>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#FF2E93] to-[#C026D3] hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-pink-500/20 transition cursor-pointer"
        >
          {resetLabel}
        </button>
      )}
    </div>
  );
};
