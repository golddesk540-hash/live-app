'use client';

import React from 'react';
import {
  CheckCircle2,
  Clock,
  CreditCard,
  FileSpreadsheet,
  SearchX,
  XCircle,
} from 'lucide-react';
import { WithdrawalEmptyKind } from './types';

interface WithdrawalEmptyStateProps {
  kind: WithdrawalEmptyKind;
  onReset?: () => void;
  resetLabel?: string;
}

const EMPTY_CONFIG: Record<
  WithdrawalEmptyKind,
  {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  no_requests: {
    title: 'No Demo Withdrawal Requests',
    description: 'Submit a new frontend withdrawal demo request or restore sample records.',
    icon: FileSpreadsheet,
  },
  no_pending: {
    title: 'No Pending Requests',
    description: 'There are currently zero pending demo withdrawal requests in your queue.',
    icon: Clock,
  },
  no_completed: {
    title: 'No Completed Requests',
    description: 'Completed sample withdrawal entries will appear here once recorded.',
    icon: CheckCircle2,
  },
  no_rejected: {
    title: 'No Rejected Requests',
    description: 'Zero rejected demo withdrawal records matched this filter.',
    icon: XCircle,
  },
  no_search_results: {
    title: 'No Matching Requests Found',
    description: 'No withdrawal requests matched your Request ID query or selected filters.',
    icon: SearchX,
  },
  no_payment_methods: {
    title: 'No Payment Methods Configured',
    description: 'Placeholder demo payment methods are hidden in this empty state preview.',
    icon: CreditCard,
  },
};

export const WithdrawalEmptyState: React.FC<WithdrawalEmptyStateProps> = ({
  kind,
  onReset,
  resetLabel = 'Restore Sample Records',
}) => {
  const cfg = EMPTY_CONFIG[kind];
  const Icon = cfg.icon;

  return (
    <div
      data-testid={`withdrawal-empty-${kind}`}
      className="rounded-3xl bg-[#1A0E33]/95 border border-purple-500/25 p-8 text-center shadow-lg"
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
