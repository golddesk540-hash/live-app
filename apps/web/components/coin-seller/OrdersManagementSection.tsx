'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Coins,
  Eye,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { formatCoinCount } from './mockCoinSellerData';
import { getOrderStatusBadgeClasses } from './OrderDetailView';
import { SellerEmptyState } from './SellerEmptyState';
import { CoinOrderRecord, OrderStatus, SalesSortMode, SellerAccountStatus } from './types';

export type OrdersStatusFilter = 'All' | OrderStatus;

interface OrdersManagementSectionProps {
  orders: CoinOrderRecord[];
  sellerStatus: SellerAccountStatus;
  statusFilter: OrdersStatusFilter;
  onStatusFilterChange: (next: OrdersStatusFilter) => void;
  onOpenOrderDetail: (order: CoinOrderRecord) => void;
  onUpdateOrderStatus: (orderId: string, nextStatus: OrderStatus) => void;
}

export const OrdersManagementSection: React.FC<OrdersManagementSectionProps> = ({
  orders,
  sellerStatus,
  statusFilter,
  onStatusFilterChange,
  onOpenOrderDetail,
  onUpdateOrderStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SalesSortMode>('date_desc');

  const counts = useMemo(() => {
    return {
      All: orders.length,
      Pending: orders.filter((o) => o.status === 'Pending').length,
      Processing: orders.filter((o) => o.status === 'Processing').length,
      Completed: orders.filter((o) => o.status === 'Completed').length,
      Cancelled: orders.filter((o) => o.status === 'Cancelled').length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = orders.filter((o) => {
      if (statusFilter !== 'All' && o.status !== statusFilter) return false;
      if (q) {
        const hay =
          `${o.id} ${o.salesId} ${o.buyerUsername} ${o.buyerId} ${o.coinPackage} ${o.transactionRef}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortMode === 'date_desc') {
        const d = b.orderDateIso.localeCompare(a.orderDateIso);
        return d !== 0 ? d : b.orderTimeLabel.localeCompare(a.orderTimeLabel);
      }
      if (sortMode === 'date_asc') {
        const d = a.orderDateIso.localeCompare(b.orderDateIso);
        return d !== 0 ? d : a.orderTimeLabel.localeCompare(b.orderTimeLabel);
      }
      if (sortMode === 'coins_desc') return b.coinQuantity - a.coinQuantity;
      return a.coinQuantity - b.coinQuantity;
    });
  }, [orders, statusFilter, searchQuery, sortMode]);

  const filterTabs: Array<{ id: OrdersStatusFilter; label: string; count: number }> = [
    { id: 'All', label: 'All Orders', count: counts.All },
    { id: 'Pending', label: 'Pending', count: counts.Pending },
    { id: 'Processing', label: 'Processing', count: counts.Processing },
    { id: 'Completed', label: 'Completed', count: counts.Completed },
    { id: 'Cancelled', label: 'Cancelled', count: counts.Cancelled },
  ];

  const getEmptyKind = () => {
    if (orders.length === 0) return 'no_orders';
    if (searchQuery.trim()) return 'no_search_results';
    if (statusFilter === 'Pending') return 'no_pending_orders';
    if (statusFilter === 'Completed') return 'no_completed_orders';
    if (statusFilter === 'Cancelled') return 'no_cancelled_orders';
    return 'no_orders';
  };

  const canModify = sellerStatus === 'Active';

  return (
    <section data-testid="coin-seller-orders-section" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-white">Orders Management</h2>
          <p className="text-xs text-purple-200/75">
            Search, filter, inspect details, or test local demo status transitions
          </p>
        </div>
        <span className="text-[11px] px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/25 text-amber-200 font-semibold">
          Local Demo Controls Only
        </span>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {filterTabs.map((tab) => {
          const active = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-testid={`orders-filter-${tab.id.toLowerCase()}`}
              onClick={() => onStatusFilterChange(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border transition cursor-pointer ${
                active
                  ? 'bg-gradient-to-r from-[#FF2E93] to-[#C026D3] border-pink-400 text-white shadow'
                  : 'bg-[#1A0E33] hover:bg-[#241445] border-purple-500/25 text-purple-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  active ? 'bg-black/25 text-white' : 'bg-white/10 text-purple-200'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-purple-300/75 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="orders-search-input"
            placeholder="Search by Order ID, Buyer username, Buyer ID, package, or tx ref..."
            className="w-full rounded-2xl bg-[#1A0E33] border border-purple-500/30 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-purple-300/50 focus:outline-none focus:border-pink-400"
          />
        </div>

        <button
          type="button"
          data-testid="orders-sort-toggle"
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
            {sortMode === 'date_desc' && 'Newest First'}
            {sortMode === 'date_asc' && 'Oldest First'}
            {sortMode === 'coins_desc' && 'Coins: High to Low'}
            {sortMode === 'coins_asc' && 'Coins: Low to High'}
          </span>
        </button>
      </div>

      {/* Results */}
      {filteredOrders.length === 0 ? (
        <SellerEmptyState
          kind={getEmptyKind()}
          onReset={() => {
            setSearchQuery('');
            onStatusFilterChange('All');
          }}
          resetLabel="Show All Sample Orders"
        />
      ) : (
        <>
          {/* Mobile / Tablet card list */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-3">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                data-testid={`order-card-${order.id}`}
                className="rounded-2xl bg-[#1A0E33]/95 border border-purple-500/25 p-4 space-y-3 shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={order.buyerAvatar} alt={order.buyerUsername} size="md" ring="pink" />
                    <div className="min-w-0">
                      <p className="text-xs font-mono font-bold text-amber-300">{order.id}</p>
                      <p className="text-sm font-bold text-white truncate">{order.buyerUsername}</p>
                      <p className="text-[11px] text-purple-300/80">{order.buyerId}</p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold shrink-0 ${getOrderStatusBadgeClasses(order.status)}`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="rounded-xl bg-[#120826]/90 border border-white/5 px-3 py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-white">{order.coinPackage}</p>
                    <p className="text-[11px] text-purple-300/75">
                      {order.orderDateLabel} · {order.orderTimeLabel}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-amber-300 tabular-nums">
                      {formatCoinCount(order.coinQuantity)} Coins
                    </p>
                    <p className="text-[10px] text-purple-300/75">Demo package value</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    data-testid={`view-order-detail-${order.id}`}
                    onClick={() => onOpenOrderDetail(order)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#FF2E93] to-[#C026D3] text-xs font-bold text-white cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Details
                  </button>

                  {canModify && order.status === 'Pending' && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onUpdateOrderStatus(order.id, 'Processing')}
                        className="px-2.5 py-1.5 rounded-full bg-sky-500/20 border border-sky-400/35 text-[11px] font-bold text-sky-200 cursor-pointer"
                      >
                        Process
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateOrderStatus(order.id, 'Completed')}
                        className="px-2.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/35 text-[11px] font-bold text-emerald-200 cursor-pointer"
                      >
                        Complete
                      </button>
                    </div>
                  )}

                  {canModify && order.status === 'Processing' && (
                    <button
                      type="button"
                      onClick={() => onUpdateOrderStatus(order.id, 'Completed')}
                      className="px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/35 text-[11px] font-bold text-emerald-200 cursor-pointer"
                    >
                      Mark Completed
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop professional table */}
          <div className="hidden lg:block rounded-3xl bg-[#1A0E33]/95 border border-purple-500/25 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-[#130926]/80 text-[11px] font-bold uppercase tracking-wider text-purple-300">
                    <th className="py-3.5 px-4">Order ID</th>
                    <th className="py-3.5 px-4">Buyer</th>
                    <th className="py-3.5 px-4">Coin Package</th>
                    <th className="py-3.5 px-4">Order Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      data-testid={`order-row-${order.id}`}
                      className="hover:bg-white/[0.03] transition"
                    >
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-amber-300">
                        {order.id}
                        <div className="text-[10px] font-normal text-purple-300/70">
                          {order.transactionRef}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar src={order.buyerAvatar} alt={order.buyerUsername} size="sm" />
                          <div>
                            <div className="font-semibold text-white">{order.buyerUsername}</div>
                            <div className="text-[11px] text-purple-300/75">{order.buyerId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-amber-300 flex items-center gap-1.5 tabular-nums">
                          <Coins className="w-3.5 h-3.5" />
                          {formatCoinCount(order.coinQuantity)} Coins
                        </div>
                        <div className="text-[11px] text-purple-300/75">{order.demoOrderValue}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-purple-100">
                        <div>{order.orderDateLabel}</div>
                        <div className="text-purple-300/70">{order.orderTimeLabel}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold ${getOrderStatusBadgeClasses(order.status)}`}
                        >
                          {order.status === 'Completed' && <CheckCircle2 className="w-3 h-3" />}
                          {order.status === 'Pending' && <Clock className="w-3 h-3" />}
                          {order.status === 'Processing' && <RefreshCw className="w-3 h-3" />}
                          {order.status === 'Cancelled' && <XCircle className="w-3 h-3" />}
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {canModify && order.status === 'Pending' && (
                            <button
                              type="button"
                              onClick={() => onUpdateOrderStatus(order.id, 'Completed')}
                              className="px-2.5 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/35 text-[11px] font-bold text-emerald-200 cursor-pointer"
                            >
                              Complete (Demo)
                            </button>
                          )}
                          {canModify && order.status === 'Processing' && (
                            <button
                              type="button"
                              onClick={() => onUpdateOrderStatus(order.id, 'Completed')}
                              className="px-2.5 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/35 text-[11px] font-bold text-emerald-200 cursor-pointer"
                            >
                              Complete (Demo)
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onOpenOrderDetail(order)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#FF2E93] to-[#C026D3] hover:brightness-110 text-[11px] font-bold text-white cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            View Details
                          </button>
                        </div>
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
