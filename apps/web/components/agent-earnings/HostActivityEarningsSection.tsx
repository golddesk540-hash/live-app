'use client';

import React, { useMemo, useState } from 'react';
import { ChevronRight, Search, ShieldCheck, Users, X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { AgentEmptyState } from './AgentEmptyState';
import { getEarningStatusPillStyle } from './EarningDetailView';
import { formatSamplePts } from './mockAgentEarningsData';
import {
  EarningDetailPayload,
  EarningRecordStatus,
  HostActivityEarningItem,
} from './types';

interface HostActivityEarningsSectionProps {
  items: HostActivityEarningItem[];
  onInspectDetail: (payload: EarningDetailPayload) => void;
  onRestoreItems: () => void;
}

type HostStatusFilter = 'All' | Extract<EarningRecordStatus, 'Completed' | 'Pending' | 'Processing'>;

export const HostActivityEarningsSection: React.FC<HostActivityEarningsSectionProps> = ({
  items,
  onInspectDetail,
  onRestoreItems,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<HostStatusFilter>('All');

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter !== 'All' && item.status !== statusFilter) return false;
      if (q) {
        const hay = `${item.username} ${item.handle} ${item.hostId} ${item.recordId}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, searchQuery, statusFilter]);

  const openDetail = (item: HostActivityEarningItem) => {
    onInspectDetail({
      recordId: item.recordId,
      category: 'Host Activity Earning (Demo)',
      relatedHostOrActivity: `${item.username} · ${item.relatedEarningTitle}`,
      hostHandle: item.handle,
      hostAvatarUrl: item.avatarUrl,
      hostId: item.hostId,
      dateLabel: item.activityDateLabel,
      referenceCode: item.hostId,
      sampleAmountPts: item.sampleAmountPts,
      status: item.status,
      additionalInfo: `Activity summary: ${item.activitySummary}. Host identity reused from Module 9.7 Agency sample roster without duplicating agency roster controls.`,
    });
  };

  return (
    <div className="space-y-4" data-testid="host-activity-earnings-section">
      {/* Header + Search + Status Filter */}
      <div className="rounded-3xl bg-[#1A0B2E]/95 border border-purple-400/20 p-4 sm:p-5 space-y-4 shadow-[0_14px_38px_rgba(9,3,22,0.5)]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#FF2E93]/15 border border-[#FF2E93]/35 flex items-center justify-center">
            <Users className="w-4 h-4 text-[#FF6BA3]" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">Host Activity Earnings</h2>
            <p className="text-[11px] text-purple-200/75">
              Sample host earning records linked from Agency roster identities (pts)
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-purple-300/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="host-activity-search-input"
            placeholder="Search host name, @handle, or Host ID (PL-...)..."
            className="w-full pl-10 pr-9 py-2.5 rounded-full bg-[#120624] border border-purple-400/25 text-xs sm:text-sm text-white placeholder:text-purple-300/45 focus:outline-none focus:border-[#FF2E93]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear host search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(['All', 'Completed', 'Pending', 'Processing'] as HostStatusFilter[]).map((st) => {
            const active = statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                data-testid={`host-activity-filter-${st.toLowerCase()}`}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition border ${
                  active
                    ? 'bg-[#FF2E93] text-white border-[#FF2E93] shadow-[0_6px_18px_rgba(255,46,147,0.35)]'
                    : 'bg-[#120624] text-purple-200/80 border-purple-400/20 hover:border-purple-300/40'
                }`}
              >
                {st}
              </button>
            );
          })}
        </div>
      </div>

      {items.length === 0 ? (
        <AgentEmptyState kind="no_host_activity" onAction={onRestoreItems} />
      ) : filtered.length === 0 ? (
        <AgentEmptyState
          kind="no_search_results"
          onAction={() => {
            setSearchQuery('');
            setStatusFilter('All');
          }}
        />
      ) : (
        <div className="space-y-2.5" data-testid="host-activity-list">
          {filtered.map((item) => (
            <button
              key={item.recordId}
              type="button"
              onClick={() => openDetail(item)}
              data-testid={`host-activity-row-${item.hostId}`}
              className="w-full text-left rounded-2xl bg-[#1A0B2E]/95 hover:bg-[#241040] border border-purple-400/20 hover:border-[#FF2E93]/45 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar src={item.avatarUrl} alt={item.username} size="md" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white truncate">
                      {item.username}
                    </span>
                    {item.verified && (
                      <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    )}
                    <span className="font-mono text-[10px] text-amber-300 ml-1">
                      {item.hostId}
                    </span>
                  </div>
                  <div className="text-[11px] text-purple-200/75 truncate">
                    {item.handle} · {item.activitySummary}
                  </div>
                  <div className="text-[11px] text-purple-300/75 mt-0.5">
                    {item.relatedEarningTitle} · {item.activityDateLabel}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${getEarningStatusPillStyle(
                    item.status
                  )}`}
                >
                  {item.status}
                </span>
                <span className="text-sm font-black text-amber-300 whitespace-nowrap">
                  +{formatSamplePts(item.sampleAmountPts)} pts
                </span>
                <ChevronRight className="w-4 h-4 text-purple-300/70" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
