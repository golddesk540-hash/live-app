'use client';

import React from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  Hash,
  Info,
  Package,
  RefreshCw,
  ShieldCheck,
  User,
  XCircle,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { formatCoinCount } from './mockCoinSellerData';
import { CoinOrderRecord, OrderStatus, SellerAccountStatus } from './types';

export function getOrderStatusBadgeClasses(status: OrderStatus | 'Updated'): string {
  switch (status) {
    case 'Completed':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-400/35';
    case 'Pending':
      return 'bg-amber-500/15 text-amber-300 border-amber-400/35';
    case 'Processing':
      return 'bg-sky-500/15 text-sky-300 border-sky-400/35';
    case 'Cancelled':
      return 'bg-rose-500/15 text-rose-300 border-rose-400/35';
    case 'Updated':
    default:
      return 'bg-purple-500/20 text-purple-200 border-purple-400/35';
  }
}

interface OrderDetailViewProps {
  order: CoinOrderRecord;
  sellerStatus: SellerAccountStatus;
  onBack: () => void;
  onUpdateStatus: (orderId: string, nextStatus: OrderStatus) => void;
}

export const OrderDetailView: React.FC<OrderDetailViewProps> = ({
  order,
  sellerStatus,
  onBack,
  onUpdateStatus,
}) => {
  const canModify = sellerStatus === 'Active';

  return (
    <section
      data-testid="coin-seller-order-detail-view"
      className="space-y-4 animate-in fade-in duration-200"
    >
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          data-testid="order-detail-back-btn"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1B1033] hover:bg-[#26164A] border border-purple-500/30 text-sm font-semibold text-white transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-pink-400" />
          Back to Orders
        </button>

        <span className="text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-200">
          Demo Order Details
        </span>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-[#231244] via-[#1B0E35] to-[#140A28] border border-purple-500/30 p-5 md:p-6 shadow-xl space-y-5">
        {/* Top order header */}
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <Avatar
              src={order.buyerAvatar}
              alt={order.buyerUsername}
              size="lg"
              ring="vip"
            />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-amber-300/90">
                {order.coinPackage}
              </p>
              <h2
                data-testid="order-detail-id"
                className="text-xl md:text-2xl font-extrabold text-white tracking-tight mt-0.5"
              >
                {order.id}
              </h2>
              <p className="text-sm text-purple-200/85 mt-0.5">
                Buyer: <span className="font-semibold text-white">{order.buyerUsername}</span> ·{' '}
                <span className="font-mono text-xs text-purple-300">{order.buyerId}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span
              data-testid="order-detail-status-badge"
              className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border text-xs font-bold ${getOrderStatusBadgeClasses(order.status)}`}
            >
              {order.status === 'Completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
              {order.status === 'Pending' && <Clock className="w-3.5 h-3.5" />}
              {order.status === 'Processing' && <RefreshCw className="w-3.5 h-3.5" />}
              {order.status === 'Cancelled' && <XCircle className="w-3.5 h-3.5" />}
              {order.status}
            </span>
            <span className="text-[11px] text-purple-300/80">
              Sales Record: <strong className="text-white">{order.salesId}</strong>
            </span>
          </div>
        </div>

        {/* Highlight quantity + demo value */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="rounded-2xl bg-[#130926]/90 border border-amber-400/30 p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300/80">
                Coin Quantity
              </p>
              <p className="text-2xl font-extrabold text-white mt-1 tabular-nums">
                {formatCoinCount(order.coinQuantity)}{' '}
                <span className="text-sm font-semibold text-amber-300">Coins</span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-400/35 flex items-center justify-center">
              <Coins className="w-5 h-5 text-amber-300" />
            </div>
          </div>

          <div className="rounded-2xl bg-[#130926]/90 border border-purple-500/25 p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-purple-300/80">
                Demo Order Value
              </p>
              <p className="text-lg font-bold text-white mt-1">{order.demoOrderValue}</p>
              <p className="text-[11px] text-purple-300/70 mt-0.5">
                Sample tier display only · No fiat conversion
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-pink-500/15 border border-pink-400/35 flex items-center justify-center">
              <Package className="w-5 h-5 text-pink-300" />
            </div>
          </div>
        </div>

        {/* 10 required fields structured cleanly */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-3.5">
            <div className="flex items-center gap-2 text-xs text-purple-300/80 mb-1">
              <User className="w-3.5 h-3.5 text-pink-400" />
              Buyer Username & Mock ID
            </div>
            <p className="text-sm font-bold text-white">
              {order.buyerUsername} <span className="text-purple-300 font-mono">({order.buyerId})</span>
            </p>
          </div>

          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-3.5">
            <div className="flex items-center gap-2 text-xs text-purple-300/80 mb-1">
              <Package className="w-3.5 h-3.5 text-amber-400" />
              Coin Package
            </div>
            <p className="text-sm font-bold text-white">{order.coinPackage}</p>
          </div>

          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-3.5">
            <div className="flex items-center gap-2 text-xs text-purple-300/80 mb-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              Order Date & Time
            </div>
            <p className="text-sm font-bold text-white">
              {order.orderDateLabel} · {order.orderTimeLabel}
            </p>
          </div>

          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-3.5">
            <div className="flex items-center gap-2 text-xs text-purple-300/80 mb-1">
              <Hash className="w-3.5 h-3.5 text-emerald-400" />
              Transaction Reference
            </div>
            <p className="text-sm font-bold font-mono text-white">{order.transactionRef}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-purple-950/60 border border-purple-400/20 p-3.5 flex items-start gap-2.5 text-xs text-purple-200/85">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-white">Frontend Display Only — No Payment Details Shown</p>
            <p className="mt-0.5 text-purple-200/75">{order.note}</p>
          </div>
        </div>

        {/* Controlled local demo status interactions */}
        <div className="pt-2 border-t border-white/10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-purple-300">
              Controlled Demo Order Status Controls
            </p>
            {!canModify && (
              <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                Switch Seller Status to Active in Profile to test transitions
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              disabled={!canModify || order.status === 'Processing'}
              onClick={() => onUpdateStatus(order.id, 'Processing')}
              data-testid="detail-mark-processing-btn"
              className="px-4 py-2 rounded-full text-xs font-bold bg-sky-500/20 hover:bg-sky-500/30 disabled:opacity-40 disabled:cursor-not-allowed border border-sky-400/40 text-sky-200 transition cursor-pointer"
            >
              Mark Processing (Demo)
            </button>

            <button
              type="button"
              disabled={!canModify || order.status === 'Completed'}
              onClick={() => onUpdateStatus(order.id, 'Completed')}
              data-testid="detail-mark-completed-btn"
              className="px-4 py-2 rounded-full text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed border border-emerald-400/40 text-emerald-200 transition cursor-pointer"
            >
              Mark Completed (Demo)
            </button>

            <button
              type="button"
              disabled={!canModify || order.status === 'Cancelled'}
              onClick={() => onUpdateStatus(order.id, 'Cancelled')}
              data-testid="detail-mark-cancelled-btn"
              className="px-4 py-2 rounded-full text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 disabled:opacity-40 disabled:cursor-not-allowed border border-rose-400/40 text-rose-200 transition cursor-pointer"
            >
              Cancel Demo Order
            </button>

            {order.status !== 'Pending' && (
              <button
                type="button"
                disabled={!canModify}
                onClick={() => onUpdateStatus(order.id, 'Pending')}
                data-testid="detail-reopen-pending-btn"
                className="px-4 py-2 rounded-full text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 disabled:opacity-40 disabled:cursor-not-allowed border border-amber-400/35 text-amber-200 transition cursor-pointer"
              >
                Reset to Pending (Demo)
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
