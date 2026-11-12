'use client';

import React from 'react';
import { BarChart3, Building2, Clock, RotateCcw, SearchX, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AgencyEmptyKind } from './types';

interface AgencyEmptyStateProps {
  kind: AgencyEmptyKind;
  onAction: () => void;
  actionLabel?: string;
}

const EMPTY_CONFIG: Record<
  AgencyEmptyKind,
  { title: string; message: string; button: string; icon: React.ComponentType<{ className?: string }> }
> = {
  no_agency_info: {
    title: 'No Agency Information',
    message: 'Agency profile details are currently cleared in this local preview.',
    button: 'Restore Agency Info',
    icon: Building2,
  },
  no_hosts: {
    title: 'No Hosts Available',
    message: 'There are currently no host records loaded in the sample agency roster.',
    button: 'Restore Sample Hosts',
    icon: Users,
  },
  no_active_hosts: {
    title: 'No Active Hosts',
    message: 'No host records currently match the Active status filter.',
    button: 'Show All Hosts',
    icon: Users,
  },
  no_pending_hosts: {
    title: 'No Pending Hosts',
    message: 'All sample host onboarding records have cleared or been filtered out.',
    button: 'Show All Hosts',
    icon: Clock,
  },
  no_search_results: {
    title: 'No Search Results',
    message: 'Try a different host name, @handle, or Host ID like PL-88401.',
    button: 'Clear Search & Filters',
    icon: SearchX,
  },
  no_performance_data: {
    title: 'No Performance Data',
    message: 'Sample performance charts and activity history are currently cleared in preview mode.',
    button: 'Restore Performance Data',
    icon: BarChart3,
  },
};

export const AgencyEmptyState: React.FC<AgencyEmptyStateProps> = ({
  kind,
  onAction,
  actionLabel,
}) => {
  const cfg = EMPTY_CONFIG[kind];
  const Icon = cfg.icon;

  return (
    <div
      data-testid={`agency-empty-${kind}`}
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
          data-testid={`agency-empty-reset-${kind}`}
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
