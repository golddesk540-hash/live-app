'use client';

import React, { useMemo, useState } from 'react';
import { Calendar, Coins, Eye, Search } from 'lucide-react';
import { formatPts, matchesWithdrawalDateFilter } from './mockWithdrawalsData';
import { getWithdrawalStatusStyle, WithdrawalStatusIcon } from './WithdrawalDetailView';
import { WithdrawalEmptyState } from './WithdrawalEmptyState';
import { WithdrawalDateFilter, WithdrawalRecord, WithdrawalStatus } from './types';

export type HistoryStatusFilter = 'All' | WithdrawalStatus;

interface WithdrawalHistorySectionProps {
  records: WithdrawalRecord[];
  statusFilter: HistoryStatusFilter;
  onStatusFilterChange: (next: HistoryStatusFilter) => void;
  onOpenDetail: (record: WithdrawalRecord) => void;
}

export const WithdrawalHistorySection: React.FC<WithdrawalHistorySectionProps> = ({
  records,
  statusFilter,
  onStatusFilterChange,
  onOpenDetail,
}) => {
  const [dateFilter, setDateFilter] = useState<WithdrawalDateFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const counts = useMemo(() => {
    return {
      All: records.length,
      Pending: records.filter((r) => r.status === 'Pending').length,
      Processing: records.filter((r) => r.status === 'Processing').length,
      Approved: records.filter((r) => r.status === 'Approved').length,
      Rejected: records.filter((r) => r.status === 'Rejected').length,
      Completed: records.filter((r) => r.status === 'Completed').length,
    };
  }, [records]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return records.filter((rec) => {
      if (statusFilter !== 'All' && rec.status !== statusFilter) return false;
      if (!matchesWithdrawalDateFilter(rec.requestDateIso, dateFilter)) return false;
      if (q) {
        const hay = `${rec.id} ${rec.paymentMethodName} ${rec.demoTxRef} ${rec.maskedAccountDetails}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [records, statusFilter, dateFilter, searchQuery]);

  const filterPills: Array<{ id: HistoryStatusFilter; label: string; count: number }> = [
    { id: 'All', label: 'All Requests', count: counts.All },
    { id: 'Pending', label: 'Pending', count: counts.Pending },
    { id: 'Processing', label: 'Processing', count: counts.Processing },
    { id: 'Approved', label: 'Approved', count: counts.Approved },
    { id: 'Rejected', label: 'Rejected', count: counts.Rejected },
    { id: 'Completed', label: 'Completed', count: counts.Completed },
  ];

  const getEmptyKind = () => {
    if (records.length === 0) return 'no_requests';
    if (searchQuery.trim()) return 'no_search_results';
    if (statusFilter === 'Pending') return 'no_pending';
    if (statusFilter === 'Completed') return 'no_completed';
    if (statusFilter === 'Rejected') return 'no_rejected';
    return 'no_search_results';
  };

  return (
    <section data-testid="withdrawal-history-section" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-extrabold text-white">Withdrawal History</h2>
          <p className="text-xs text-purple-200/75">
            Showing {filtered.length} of {records.length} demo withdrawal requests
          </p>
        </div>
        <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-purple-200">
          Demo Records Only
        </span>
      </div>

      {/* Status Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {filterPills.map((pill) => {
          const active = statusFilter === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              data-testid={`history-filter-${pill.id.toLowerCase()}`}
              onClick={() => onStatusFilterChange(pill.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border transition cursor-pointer ${
                active
                  ? 'bg-gradient-to-r from-[#FF2E93] to-[#C026D3] border-pink-400 text-white shadow'
                  : 'bg-[#1A0E33] hover:bg-[#241445] border-purple-500/25 text-purple-200'
              }`}
            >
              <span>{pill.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  active ? 'bg-black/25 text-white' : 'bg-white/10 text-purple-200'
                }`}
              >
                {pill.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search + Date Filter */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-purple-300/75 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="history-search-input"
            placeholder="Search by Request ID (e.g. WD1024), method, or tx ref..."
            className="w-full rounded-2xl bg-[#1A0E33] border border-purple-500/30 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-purple-300/50 focus:outline-none focus:border-pink-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-300 shrink-0 hidden sm:block" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as WithdrawalDateFilter)}
            data-testid="history-date-select"
            aria-label="Filter withdrawal history by date"
            className="rounded-2xl bg-[#1A0E33] border border-purple-500/30 px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-pink-400 cursor-pointer"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
          </select>
        </div>
      </div>

      {/* List / Table */}
      {filtered.length === 0 ? (
        <WithdrawalEmptyState
          kind={getEmptyKind()}
          onReset={() => {
            setSearchQuery('');
            setDateFilter('all');
            onStatusFilterChange('All');
          }}
          resetLabel="Show All Sample Requests"
        />
      ) : (
        <>
          {/* Mobile / Tablet cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-3">
            {filtered.map((rec) => (
              <div
                key={rec.id}
                data-testid={`withdrawal-card-${rec.id}`}
                className="rounded-2xl bg-[#1A0E33]/95 border border-purple-500/25 p-4 space-y-2.5 shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-mono font-bold text-amber-300">Request #{rec.id}</p>
                    <p className="text-sm font-extrabold text-white mt-0.5">
                      {formatPts(rec.amount)} {rec.unitLabel} (Demo)
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold shrink-0 ${getWithdrawalStatusStyle(rec.status)}`}
                  >
                    <WithdrawalStatusIcon status={rec.status} className="w-3 h-3" />
                    {rec.status}
                  </span>
                </div>

                <div className="rounded-xl bg-[#120826] border border-white/5 px-3 py-2 text-xs space-y-0.5">
                  <p className="font-semibold text-purple-100">{rec.paymentMethodName}</p>
                  <p className="text-[11px] text-purple-300/75">
                    {rec.maskedAccountDetails} · {rec.requestDateLabel}
                  </p>
                </div>

                <button
                  type="button"
                  data-testid={`view-withdrawal-detail-${rec.id}`}
                  onClick={() => onOpenDetail(rec)}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full bg-gradient-to-r from-[#FF2E93] to-[#C026D3] text-xs font-bold text-white cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Details
                </button>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block rounded-3xl bg-[#1A0E33]/95 border border-purple-500/25 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-[#130926]/80 text-[11px] font-bold uppercase tracking-wider text-purple-300">
                    <th className="py-3.5 px-4">Request ID</th>
                    <th className="py-3.5 px-4">Requested Amount</th>
                    <th className="py-3.5 px-4">Payment Method</th>
                    <th className="py-3.5 px-4">Request Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {filtered.map((rec) => (
                    <tr
                      key={rec.id}
                      data-testid={`withdrawal-row-${rec.id}`}
                      className="hover:bg-white/[0.03] transition"
                    >
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-amber-300">
                        #{rec.id}
                        <div className="text-[10px] font-normal text-purple-300/70">
                          {rec.demoTxRef}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-amber-300 tabular-nums">
                        <span className="inline-flex items-center gap-1.5">
                          <Coins className="w-3.5 h-3.5" />
                          {formatPts(rec.amount)} {rec.unitLabel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{rec.paymentMethodName}</div>
                        <div className="text-[11px] font-mono text-purple-300/75">
                          {rec.maskedAccountDetails}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-purple-100">
                        <div>{rec.requestDateLabel}</div>
                        <div className="text-purple-300/70">{rec.requestTimeLabel}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold ${getWithdrawalStatusStyle(rec.status)}`}
                        >
                          <WithdrawalStatusIcon status={rec.status} className="w-3 h-3" />
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenDetail(rec)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#FF2E93] to-[#C026D3] hover:brightness-110 text-[11px] font-bold text-white cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
};
