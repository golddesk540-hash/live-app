'use client';

import React, { useMemo, useState } from 'react';
import { ChevronRight, FileSpreadsheet, Search, X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { AgentEmptyState } from './AgentEmptyState';
import { getEarningStatusPillStyle } from './EarningDetailView';
import { formatSamplePts } from './mockAgentEarningsData';
import {
  CommissionHistoryRecord,
  EarningDetailPayload,
  EarningRecordStatus,
} from './types';

interface CommissionHistorySectionProps {
  records: CommissionHistoryRecord[];
  onInspectDetail: (payload: EarningDetailPayload) => void;
  onRestoreRecords: () => void;
}

type CommissionStatusFilter = 'All' | EarningRecordStatus;

const STATUS_PILLS: CommissionStatusFilter[] = [
  'All',
  'Pending',
  'Processing',
  'Completed',
  'Cancelled',
];

export const CommissionHistorySection: React.FC<CommissionHistorySectionProps> = ({
  records,
  onInspectDetail,
  onRestoreRecords,
}) => {
  const [statusFilter, setStatusFilter] = useState<CommissionStatusFilter>('All');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((rec) => {
      if (statusFilter !== 'All' && rec.status !== statusFilter) return false;
      if (q) {
        const hay = `${rec.commissionId} ${rec.hostName} ${rec.hostHandle} ${rec.activityTitle}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [records, statusFilter, query]);

  const openDetail = (rec: CommissionHistoryRecord) => {
    onInspectDetail({
      recordId: rec.commissionId,
      category: 'Demo Commission History',
      relatedHostOrActivity: `${rec.hostName} · ${rec.activityTitle}`,
      hostHandle: rec.hostHandle,
      hostAvatarUrl: rec.hostAvatarUrl,
      hostId: rec.hostId,
      dateLabel: rec.activityDateLabel,
      referenceCode: rec.linkedEarningId,
      sampleAmountPts: rec.sampleCommissionPts,
      status: rec.status,
      additionalInfo: rec.note,
    });
  };

  return (
    <div className="space-y-4" data-testid="commission-history-section">
      {/* Header + Search & Status Filter */}
      <div className="rounded-3xl bg-[#1A0B2E]/95 border border-purple-400/20 p-4 sm:p-5 space-y-4 shadow-[0_14px_38px_rgba(9,3,22,0.5)]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-400/15 border border-amber-400/35 flex items-center justify-center">
            <FileSpreadsheet className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">Commission History</h2>
            <p className="text-[11px] text-purple-200/75">
              Demo commission records in pts (no percentages or official formulas applied)
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-purple-300/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            data-testid="commission-search-input"
            placeholder="Search by COM ID, host name, or activity..."
            className="w-full pl-10 pr-9 py-2.5 rounded-full bg-[#120624] border border-purple-400/25 text-xs sm:text-sm text-white placeholder:text-purple-300/45 focus:outline-none focus:border-[#FF2E93]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear commission search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_PILLS.map((st) => {
            const active = statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                data-testid={`commission-filter-${st.toLowerCase()}`}
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

      {/* Empty or List */}
      {records.length === 0 ? (
        <AgentEmptyState kind="no_commission_history" onAction={onRestoreRecords} />
      ) : filtered.length === 0 ? (
        <AgentEmptyState
          kind="no_search_results"
          onAction={() => {
            setQuery('');
            setStatusFilter('All');
          }}
        />
      ) : (
        <div className="space-y-2.5" data-testid="commission-history-list">
          {filtered.map((rec) => (
            <button
              key={rec.commissionId}
              type="button"
              onClick={() => openDetail(rec)}
              data-testid={`commission-row-${rec.commissionId}`}
              className="w-full text-left rounded-2xl bg-[#1A0B2E]/95 hover:bg-[#241040] border border-purple-400/20 hover:border-[#FF2E93]/45 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar src={rec.hostAvatarUrl} alt={rec.hostName} size="sm" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] font-bold text-amber-300">
                      {rec.commissionId}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-white truncate">
                      {rec.activityTitle}
                    </span>
                  </div>
                  <div className="text-[11px] text-purple-200/75 mt-0.5 truncate">
                    Host: {rec.hostName} ({rec.hostHandle}) · {rec.activityDateLabel}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${getEarningStatusPillStyle(
                    rec.status
                  )}`}
                >
                  {rec.status}
                </span>
                <span className="text-sm font-black text-emerald-300 whitespace-nowrap">
                  +{formatSamplePts(rec.sampleCommissionPts)} pts
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
