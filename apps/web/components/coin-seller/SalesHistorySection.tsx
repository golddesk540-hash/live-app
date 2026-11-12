'use client';

import React, { useMemo, useState } from 'react';
import { ArrowUpDown, Calendar, Coins, Eye, Search } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { formatCoinCount, matchesSellerDatePeriod } from './mockCoinSellerData';
import { getOrderStatusBadgeClasses } from './OrderDetailView';
import { SellerEmptyState } from './SellerEmptyState';
import {
  CoinOrderRecord,
  CoinSalesRecord,
  DateFilterPeriod,
  SalesRecordStatus,
  SalesSortMode,
} from './types';

interface SalesHistorySectionProps {
  salesRecords: CoinSalesRecord[];
  orders: CoinOrderRecord[];
  onOpenOrderDetail: (order: CoinOrderRecord) => void;
}

export const SalesHistorySection: React.FC<SalesHistorySectionProps> = ({
  salesRecords,
  orders,
  onOpenOrderDetail,
}) => {
  const [dateFilter, setDateFilter] = useState<DateFilterPeriod | 'all'>('all');
  const [customStart, setCustomStart] = useState('2026-10-01');
  const [customEnd, setCustomEnd] = useState('2026-11-12');
  const [statusFilter, setStatusFilter] = useState<'All' | SalesRecordStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SalesSortMode>('date_desc');

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = salesRecords.filter((rec) => {
      if (statusFilter !== 'All' && rec.status !== statusFilter) return false;
      if (!matchesSellerDatePeriod(rec.salesDateIso, dateFilter, customStart, customEnd)) {
        return false;
      }
      if (q) {
        const hay =
          `${rec.id} ${rec.orderId} ${rec.buyerUsername} ${rec.buyerId} ${rec.transactionRef}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortMode === 'date_desc') {
        const d = b.salesDateIso.localeCompare(a.salesDateIso);
        return d !== 0 ? d : b.salesTimeLabel.localeCompare(a.salesTimeLabel);
      }
      if (sortMode === 'date_asc') {
        const d = a.salesDateIso.localeCompare(b.salesDateIso);
        return d !== 0 ? d : a.salesTimeLabel.localeCompare(b.salesTimeLabel);
      }
      if (sortMode === 'coins_desc') return b.coinQuantity - a.coinQuantity;
      return a.coinQuantity - b.coinQuantity;
    });
  }, [salesRecords, statusFilter, dateFilter, customStart, customEnd, searchQuery, sortMode]);

  const totalFilteredCoins = useMemo(
    () =>
      filteredRecords
        .filter((r) => r.status === 'Completed')
        .reduce((sum, r) => sum + r.coinQuantity, 0),
    [filteredRecords]
  );

  const openLinkedOrder = (orderId: string) => {
    const found = orders.find((o) => o.id === orderId);
    if (found) onOpenOrderDetail(found);
  };

  return (
    <section data-testid="coin-seller-sales-history-section" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-white">Coin Sales Records & History</h2>
          <p className="text-xs text-purple-200/75">
            {filteredRecords.length} records shown · Completed in selection:{' '}
            <strong className="text-amber-300">{formatCoinCount(totalFilteredCoins)} Coins</strong>
          </p>
        </div>
        <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-purple-200">
          Demo Records ({salesRecords.length} total)
        </span>
      </div>

      {/* Date Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'all', label: 'All Dates' },
            { id: 'today', label: 'Today' },
            { id: 'this_week', label: 'This Week' },
            { id: 'this_month', label: 'This Month' },
            { id: 'last_month', label: 'Last Month' },
            { id: 'custom', label: 'Custom Range' },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            data-testid={`sales-date-filter-${item.id}`}
            onClick={() => setDateFilter(item.id)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border transition cursor-pointer ${
              dateFilter === item.id
                ? 'bg-gradient-to-r from-[#FF2E93] to-[#C026D3] border-pink-400 text-white shadow'
                : 'bg-[#1A0E33] hover:bg-[#241445] border-purple-500/25 text-purple-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            {item.label}
          </button>
        ))}
      </div>

      {dateFilter === 'custom' && (
        <div
          data-testid="sales-custom-date-range"
          className="rounded-2xl bg-[#1A0E33] border border-purple-500/30 p-3.5 flex flex-wrap items-center gap-3"
        >
          <label className="text-xs text-purple-200 flex items-center gap-2">
            <span>From:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="rounded-xl bg-[#120826] border border-purple-500/30 px-2.5 py-1.5 text-xs text-white"
            />
          </label>
          <label className="text-xs text-purple-200 flex items-center gap-2">
            <span>To:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded-xl bg-[#120826] border border-purple-500/30 px-2.5 py-1.5 text-xs text-white"
            />
          </label>
        </div>
      )}

      {/* Search + Status + Sort */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-purple-300/75 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="sales-history-search-input"
            placeholder="Search Sales ID, Order ID, buyer username, or transaction ref..."
            className="w-full rounded-2xl bg-[#1A0E33] border border-purple-500/30 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-purple-300/50 focus:outline-none focus:border-pink-400"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'All' | SalesRecordStatus)}
          data-testid="sales-history-status-select"
          aria-label="Filter sales records by status"
          className="rounded-2xl bg-[#1A0E33] border border-purple-500/30 px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-pink-400 cursor-pointer"
        >
          <option value="All">All Statuses</option>
          <option value="Completed">Completed</option>
          <option value="Pending">Pending</option>
          <option value="Processing">Processing</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <button
          type="button"
          data-testid="sales-history-sort-btn"
          onClick={() =>
            setSortMode((prev) =>
              prev === 'date_desc'
                ? 'coins_desc'
                : prev === 'coins_desc'
                ? 'coins_asc'
                : prev === 'coins_asc'
                ? 'date_asc'
                : 'date_desc'
            )
          }
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#1A0E33] hover:bg-[#241445] border border-purple-500/30 text-xs font-bold text-white transition cursor-pointer shrink-0"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-amber-300" />
          <span>
            {sortMode === 'date_desc' && 'Latest Date'}
            {sortMode === 'date_asc' && 'Oldest Date'}
            {sortMode === 'coins_desc' && 'Coins: High-Low'}
            {sortMode === 'coins_asc' && 'Coins: Low-High'}
          </span>
        </button>
      </div>

      {/* Records List / Table */}
      {filteredRecords.length === 0 ? (
        <SellerEmptyState
          kind={
            salesRecords.length === 0
              ? 'no_sales'
              : searchQuery.trim()
              ? 'no_search_results'
              : 'no_sales'
          }
          onReset={() => {
            setSearchQuery('');
            setStatusFilter('All');
            setDateFilter('all');
          }}
          resetLabel="Reset Sales Filters"
        />
      ) : (
        <>
          {/* Mobile / Tablet cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-3">
            {filteredRecords.map((rec) => (
              <div
                key={rec.id}
                data-testid={`sales-record-card-${rec.id}`}
                className="rounded-2xl bg-[#1A0E33]/95 border border-purple-500/25 p-4 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-mono font-bold text-amber-300">
                      {rec.id} · <span className="text-purple-300">{rec.orderId}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar src={rec.buyerAvatar} alt={rec.buyerUsername} size="xs" />
                      <span className="text-sm font-bold text-white">{rec.buyerUsername}</span>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full border text-[11px] font-bold ${getOrderStatusBadgeClasses(rec.status)}`}
                  >
                    {rec.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-white/10">
                  <div>
                    <p className="text-purple-200/80">{rec.salesDateLabel}</p>
                    <p className="font-mono text-[10px] text-purple-300/70">{rec.transactionRef}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-amber-300 tabular-nums">
                      {formatCoinCount(rec.coinQuantity)} Coins
                    </p>
                    <button
                      type="button"
                      onClick={() => openLinkedOrder(rec.orderId)}
                      className="text-[11px] font-bold text-pink-300 hover:text-pink-200 underline cursor-pointer mt-0.5"
                    >
                      Inspect Order
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block rounded-3xl bg-[#1A0E33]/95 border border-purple-500/25 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-[#130926]/80 text-[11px] font-bold uppercase tracking-wider text-purple-300">
                    <th className="py-3.5 px-4">Sales Record ID</th>
                    <th className="py-3.5 px-4">Order ID</th>
                    <th className="py-3.5 px-4">Buyer Username</th>
                    <th className="py-3.5 px-4">Coin Quantity</th>
                    <th className="py-3.5 px-4">Sales Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Demo Tx Reference</th>
                    <th className="py-3.5 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {filteredRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-white/[0.03] transition">
                      <td className="py-3 px-4 font-mono text-xs font-bold text-amber-300">
                        {rec.id}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-purple-200">{rec.orderId}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Avatar src={rec.buyerAvatar} alt={rec.buyerUsername} size="xs" />
                          <span className="font-semibold text-white">{rec.buyerUsername}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-amber-300 tabular-nums">
                        <span className="inline-flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5" />
                          {formatCoinCount(rec.coinQuantity)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-purple-100">
                        {rec.salesDateLabel} · {rec.salesTimeLabel}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full border text-[11px] font-bold ${getOrderStatusBadgeClasses(rec.status)}`}
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-purple-300/85">
                        {rec.transactionRef}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => openLinkedOrder(rec.orderId)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-purple-400/30 text-xs font-bold text-white cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-pink-300" />
                          View
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
