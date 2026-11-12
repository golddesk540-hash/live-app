'use client';

import React, { useMemo, useState } from 'react';
import { InviteHistoryRecord, InviteStatusType } from './types';
import { SearchBar } from '@/components/ui/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  History,
  Hourglass,
  RotateCcw,
  SearchX,
  Users,
} from 'lucide-react';

type HistoryStatusFilter = 'all' | InviteStatusType;

const STATUS_BADGE_META: Record<
  InviteStatusType,
  { label: string; className: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-400/15 border-amber-300/40 text-amber-200',
    Icon: Clock,
  },
  joined: {
    label: 'Joined',
    className: 'bg-emerald-500/20 border-emerald-400/45 text-emerald-200',
    Icon: CheckCircle2,
  },
  expired: {
    label: 'Expired',
    className: 'bg-slate-500/20 border-slate-400/35 text-slate-300',
    Icon: Hourglass,
  },
};

interface InviteHistoryPanelProps {
  records: InviteHistoryRecord[];
  selectedRecordId: string | null;
  onSelectRecord: (record: InviteHistoryRecord) => void;
  onRestoreDemoHistory: () => void;
}

export const InviteHistoryPanel: React.FC<InviteHistoryPanelProps> = ({
  records,
  selectedRecordId,
  onSelectRecord,
  onRestoreDemoHistory,
}) => {
  const [statusFilter, setStatusFilter] = useState<HistoryStatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const counts = useMemo(() => {
    let pending = 0;
    let joined = 0;
    let expired = 0;
    for (const r of records) {
      if (r.status === 'pending') pending += 1;
      else if (r.status === 'joined') joined += 1;
      else expired += 1;
    }
    return { total: records.length, pending, joined, expired };
  }, [records]);

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return records.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.contactName.toLowerCase().includes(q) ||
        r.method.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q)
      );
    });
  }, [records, statusFilter, searchQuery]);

  const emptyConfig = useMemo(() => {
    if (searchQuery.trim()) {
      return {
        testId: 'empty-invite-history-search',
        title: 'No search results',
        description: `No invitation record matched "${searchQuery}".`,
        Icon: SearchX,
        actionLabel: 'Clear Search',
        onAction: () => setSearchQuery(''),
      };
    }
    if (records.length === 0) {
      return {
        testId: 'empty-invite-history',
        title: 'No invitation history',
        description: 'Share your Popo Live demo invite link or invite demo contacts to see records here.',
        Icon: History,
        actionLabel: 'Restore Sample History',
        onAction: onRestoreDemoHistory,
      };
    }
    if (statusFilter === 'pending') {
      return {
        testId: 'empty-invite-pending',
        title: 'No pending invitations',
        description: 'There are currently no pending mock invitations awaiting response.',
        Icon: Clock,
        actionLabel: 'View All Records',
        onAction: () => setStatusFilter('all'),
      };
    }
    return {
      testId: 'empty-invite-records',
      title: 'No invitation records',
      description: `No ${statusFilter} invitation records exist in your local history.`,
      Icon: Users,
      actionLabel: 'Show All Invitations',
      onAction: () => setStatusFilter('all'),
    };
  }, [searchQuery, records.length, statusFilter, onRestoreDemoHistory]);

  const EmptyIcon = emptyConfig.Icon;

  return (
    <div
      data-testid="invite-history-panel"
      className="rounded-3xl bg-[#16092D]/95 border border-purple-400/20 p-4 sm:p-5 space-y-4"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-base sm:text-lg font-black text-white">Invite History</h2>
          <p className="text-[11px] text-purple-200/60">
            Local demo log only — external delivery is not tracked.
          </p>
        </div>

        <button
          type="button"
          onClick={onRestoreDemoHistory}
          className="px-2.5 py-1 rounded-full bg-[#241046] hover:bg-[#311761] border border-white/10 text-[11px] font-bold text-purple-100 inline-flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3 text-cyan-300" />
          <span>Reset</span>
        </button>
      </div>

      {/* Metrics Row: Total, Pending, Accepted (Joined) */}
      <div className="grid grid-cols-3 gap-2.5">
        <div
          data-testid="history-stat-total"
          className="rounded-2xl bg-[#110523] border border-purple-400/20 p-3 text-center"
        >
          <p className="text-lg font-black text-white">{counts.total}</p>
          <p className="text-[10px] font-bold text-purple-200/60 uppercase">Total Invites</p>
        </div>
        <div
          data-testid="history-stat-pending"
          className="rounded-2xl bg-[#110523] border border-amber-400/25 p-3 text-center"
        >
          <p className="text-lg font-black text-amber-300">{counts.pending}</p>
          <p className="text-[10px] font-bold text-purple-200/60 uppercase">Pending</p>
        </div>
        <div
          data-testid="history-stat-joined"
          className="rounded-2xl bg-[#110523] border border-emerald-400/25 p-3 text-center"
        >
          <p className="text-lg font-black text-emerald-300">{counts.joined}</p>
          <p className="text-[10px] font-bold text-purple-200/60 uppercase">Accepted</p>
        </div>
      </div>

      {/* Search & Status Filters */}
      <SearchBar
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onClear={() => setSearchQuery('')}
        placeholder="Search invite history..."
        data-testid="invite-history-search"
      />

      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {(
          [
            { id: 'all', label: `All (${counts.total})` },
            { id: 'pending', label: `Pending (${counts.pending})` },
            { id: 'joined', label: `Joined (${counts.joined})` },
            { id: 'expired', label: `Expired (${counts.expired})` },
          ] as const
        ).map((tab) => {
          const active = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-testid={`history-filter-${tab.id}`}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                active
                  ? 'bg-gradient-to-r from-[#FF1A6C] to-[#EC4899] text-white shadow-glow-pink'
                  : 'bg-[#211042] text-purple-100/80 border border-purple-400/20 hover:bg-[#2B1754]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* History List or Empty States */}
      {filteredRecords.length === 0 ? (
        <div
          data-testid={emptyConfig.testId}
          className="rounded-2xl bg-[#110523] border border-purple-400/15 p-4"
        >
          <EmptyState
            icon={<EmptyIcon className="w-7 h-7" />}
            title={emptyConfig.title}
            description={emptyConfig.description}
            actionLabel={emptyConfig.actionLabel}
            onAction={emptyConfig.onAction}
          />
        </div>
      ) : (
        <div className="space-y-2" data-testid="invite-history-list">
          {filteredRecords.map((rec) => {
            const meta = STATUS_BADGE_META[rec.status];
            const BadgeIcon = meta.Icon;
            const isSelected = selectedRecordId === rec.id;

            return (
              <button
                key={rec.id}
                type="button"
                data-testid={`invite-history-row-${rec.id}`}
                onClick={() => onSelectRecord(rec)}
                className={`w-full text-left rounded-2xl p-3 border flex items-center justify-between gap-3 transition-all ${
                  isSelected
                    ? 'bg-[#251049] border-[#FF1A6C]/65 shadow-glow-pink'
                    : 'bg-[#110523]/95 border-purple-400/15 hover:border-purple-400/40'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-extrabold text-white truncate">
                      {rec.contactName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full border text-[10px] font-extrabold inline-flex items-center gap-1 ${meta.className}`}
                    >
                      <BadgeIcon className="w-2.5 h-2.5" />
                      <span>{meta.label}</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-200/60 mt-0.5">
                    {rec.invitedDate} · via {rec.method}
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-purple-300/60 shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
