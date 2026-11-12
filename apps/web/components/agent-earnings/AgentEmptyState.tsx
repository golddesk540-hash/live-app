'use client';

import React from 'react';
import {
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  RotateCcw,
  SearchX,
  Users,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AgentEmptyKind } from './types';

interface AgentEmptyStateProps {
  kind: AgentEmptyKind;
  onAction: () => void;
  actionLabel?: string;
}

const EMPTY_COPY: Record<
  AgentEmptyKind,
  { title: string; message: string; button: string; icon: React.ComponentType<{ className?: string }> }
> = {
  no_earnings: {
    title: 'No Earnings Records',
    message: 'No sample agent earning entries match the selected filter or preview state.',
    button: 'Restore Sample Earnings',
    icon: Wallet,
  },
  no_pending: {
    title: 'No Pending Earnings',
    message: 'There are currently no pending sample earning records in this view.',
    button: 'Show All Earnings',
    icon: Clock,
  },
  no_completed: {
    title: 'No Completed Earnings',
    message: 'No completed sample earning records are shown for the current filter.',
    button: 'Show All Earnings',
    icon: CheckCircle2,
  },
  no_commission_history: {
    title: 'No Commission History',
    message: 'No demo commission records match your current status filter or preview state.',
    button: 'Restore Commission History',
    icon: FileSpreadsheet,
  },
  no_host_activity: {
    title: 'No Host Activity Records',
    message: 'No host activity earning records match the active search or preview filter.',
    button: 'Show All Host Activity',
    icon: Users,
  },
  no_search_results: {
    title: 'No Search Results',
    message: 'Try clearing your search keyword or expanding the selected date filter.',
    button: 'Clear Search & Filters',
    icon: SearchX,
  },
};

export const AgentEmptyState: React.FC<AgentEmptyStateProps> = ({
  kind,
  onAction,
  actionLabel,
}) => {
  const cfg = EMPTY_COPY[kind];
  const Icon = cfg.icon;

  return (
    <div
      data-testid={`agent-empty-${kind}`}
      className="rounded-3xl bg-[#1A0B2E]/95 border border-purple-400/20 p-7 text-center shadow-[0_14px_38px_rgba(9,3,22,0.5)]"
    >
      <div className="w-14 h-14 mx-auto mb-3.5 rounded-2xl bg-purple-500/15 border border-purple-400/25 flex items-center justify-center">
        <Icon className="w-7 h-7 text-[#FF6BA3]" />
      </div>
      <h3 className="text-base font-black text-white">{cfg.title}</h3>
      <p className="text-xs text-purple-200/75 max-w-sm mx-auto mt-1.5 leading-relaxed">
        {cfg.message}
      </p>
      <div className="mt-5 flex justify-center">
        <Button
          type="button"
          onClick={onAction}
          data-testid={`agent-empty-reset-${kind}`}
          variant="primary"
          size="sm"
          className="rounded-full bg-[#FF2E93] hover:bg-[#ff429e] text-white border-0 shadow-[0_6px_20px_rgba(255,46,147,0.35)]"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          {actionLabel ?? cfg.button}
        </Button>
      </div>
    </div>
  );
};
