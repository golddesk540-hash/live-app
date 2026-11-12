'use client';

import React, { useMemo, useState } from 'react';
import { Activity, CheckCircle2, Clock, Coins, FileEdit, XCircle } from 'lucide-react';
import { formatCoinCount } from './mockCoinSellerData';
import { getOrderStatusBadgeClasses } from './OrderDetailView';
import { SellerEmptyState } from './SellerEmptyState';
import { CoinOrderRecord, SellerActivityItem } from './types';

interface SellerActivitySectionProps {
  items: SellerActivityItem[];
  orders: CoinOrderRecord[];
  onOpenOrderDetail: (order: CoinOrderRecord) => void;
}

type ActivityFilterKind =
  | 'all'
  | 'new_order'
  | 'completed_order'
  | 'cancelled_order'
  | 'record_update';

export const SellerActivitySection: React.FC<SellerActivitySectionProps> = ({
  items,
  orders,
  onOpenOrderDetail,
}) => {
  const [kindFilter, setKindFilter] = useState<ActivityFilterKind>('all');

  const filtered = useMemo(() => {
    if (kindFilter === 'all') return items;
    return items.filter((item) => item.kind === kindFilter);
  }, [items, kindFilter]);

  const openLinkedOrder = (orderId: string) => {
    const found = orders.find((o) => o.id === orderId);
    if (found) onOpenOrderDetail(found);
  };

  return (
    <section data-testid="coin-seller-activity-section" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-extrabold text-white">Seller Activity Details</h2>
          <p className="text-xs text-purple-200/75">
            Sample timeline of new demo orders, completed deliveries, cancellations, and updates
          </p>
        </div>
        <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-purple-200">
          Demo Activity Log ({items.length})
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'all', label: 'All Activity' },
            { id: 'new_order', label: 'New Demo Orders' },
            { id: 'completed_order', label: 'Completed Orders' },
            { id: 'cancelled_order', label: 'Cancelled Orders' },
            { id: 'record_update', label: 'Record Updates' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            data-testid={`activity-filter-${tab.id}`}
            onClick={() => setKindFilter(tab.id)}
            className={`px-3.5 py-2 rounded-full text-xs font-bold border transition cursor-pointer ${
              kindFilter === tab.id
                ? 'bg-gradient-to-r from-[#FF2E93] to-[#C026D3] border-pink-400 text-white'
                : 'bg-[#1A0E33] hover:bg-[#241445] border-purple-500/25 text-purple-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <SellerEmptyState
          kind="no_seller_activity"
          onReset={() => setKindFilter('all')}
          resetLabel="Show All Seller Activity"
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              data-testid={`seller-activity-item-${item.id}`}
              className="rounded-2xl bg-[#1A0E33]/95 border border-purple-500/25 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-center shrink-0 mt-0.5">
                  {item.kind === 'completed_order' && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                  )}
                  {item.kind === 'new_order' && <Clock className="w-5 h-5 text-amber-300" />}
                  {item.kind === 'cancelled_order' && <XCircle className="w-5 h-5 text-rose-300" />}
                  {item.kind === 'record_update' && <FileEdit className="w-5 h-5 text-sky-300" />}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{item.title}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getOrderStatusBadgeClasses(item.status)}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-purple-200/85 mt-0.5">{item.description}</p>
                  <p className="text-[11px] text-purple-300/70 mt-1">
                    {item.dateLabel} · {item.timeLabel}
                  </p>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-300 tabular-nums">
                  <Coins className="w-3.5 h-3.5" />
                  {formatCoinCount(item.coinQuantity)} Coins
                </span>
                <button
                  type="button"
                  onClick={() => openLinkedOrder(item.orderId)}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-purple-400/30 text-[11px] font-bold text-white cursor-pointer"
                >
                  <Activity className="w-3 h-3 text-pink-300" />
                  View {item.orderId}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
