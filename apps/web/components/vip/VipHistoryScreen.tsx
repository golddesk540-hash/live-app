'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Crown,
  Download,
  Globe,
  RefreshCw,
} from 'lucide-react';
import type { VipMembershipRecord, VipOrderRecord } from '@/lib/vip';

export function VipHistoryScreen({ previewMode = false }: { previewMode?: boolean }) {
  const [lang, setLang] = useState<'en' | 'ur'>('en');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [records, setRecords] = useState<VipMembershipRecord[]>([]);
  const [orders, setOrders] = useState<VipOrderRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isUr = lang === 'ur';
  const limit = 10;

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        status: statusFilter,
        page: String(page),
        limit: String(limit),
      });
      if (previewMode) qs.set('preview', 'demo');

      const res = await fetch(`/api/vip/history?${qs.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Sign in or use demo preview to view your VIP history.');
        return;
      }
      setRecords(data.records || []);
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err?.message || 'Failed to load VIP history.');
    } finally {
      setLoading(false);
    }
  }, [page, previewMode, statusFilter]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div
      dir={isUr ? 'rtl' : 'ltr'}
      className="min-h-screen bg-gradient-to-b from-[#0C071E] via-[#130829] to-[#080412] text-white pb-12"
      data-testid="vip-history-screen"
    >
      <div className="mx-auto max-w-4xl px-3 sm:px-6 pt-4 space-y-5">
        <header className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Link
              href={`/vip${previewMode ? '?preview=demo' : ''}`}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 text-purple-200" />
            </Link>
            <div>
              <h1 className="text-lg font-black text-white flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-300" />
                <span>{isUr ? 'وی آئی پی رکنیت کی تاریخ' : 'VIP Membership History'}</span>
              </h1>
              <p className="text-[11px] text-purple-200/70">
                {isUr
                  ? 'آپ کی تمام خریداریاں، تجدیدات، حیثیت اور سرکاری رسیدیں'
                  : 'All your VIP purchases, renewals, status lifecycle, and receipts'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLang((p) => (p === 'en' ? 'ur' : 'en'))}
              className="px-2.5 h-8 rounded-full bg-white/10 border border-purple-400/25 text-xs font-bold flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5 text-amber-300" />
              <span>{lang === 'en' ? 'اردو' : 'EN'}</span>
            </button>
            <button
              type="button"
              onClick={loadHistory}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-1.5">
          {['all', 'active', 'expired', 'cancelled', 'suspended', 'refunded', 'pending'].map(
            (st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase border transition ${
                  statusFilter === st
                    ? 'bg-[#EC248F] border-[#EC248F] text-white'
                    : 'bg-white/5 border-white/10 text-purple-200 hover:border-purple-400/40'
                }`}
              >
                {st}
              </button>
            )
          )}
        </div>

        {error && (
          <div className="rounded-2xl bg-rose-500/15 border border-rose-400/40 p-4 text-xs text-rose-200">
            {error}
          </div>
        )}

        {/* Membership History Cards */}
        <div className="space-y-3">
          {records.length === 0 && !loading ? (
            <div className="rounded-3xl bg-[#160D35]/80 border border-purple-500/25 p-6 text-center text-xs text-purple-200/75">
              {isUr ? 'کوئی VIP ریکارڈ نہیں ملا۔' : 'No VIP membership records found for this filter.'}
            </div>
          ) : (
            records.map((rec) => (
              <div
                key={rec.membershipId}
                data-testid={`vip-history-row-${rec.membershipId}`}
                className="rounded-2xl bg-[#160D35]/90 border border-purple-400/25 p-4 text-xs space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-black">
                      {rec.badgeLabel}
                    </span>
                    <span className="font-extrabold text-sm text-white">{rec.planName}</span>
                    <span className="font-mono text-[10px] text-purple-300/70">
                      {rec.membershipId}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 font-bold uppercase text-[10px] text-amber-200">
                    {rec.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-purple-200/80">
                  <div>
                    <span className="block text-white/45">Amount</span>
                    <span className="font-bold text-white">
                      {rec.currency} ${rec.purchaseAmount.toFixed(2)}
                      {rec.coinsCharged ? ` (${rec.coinsCharged} Coins)` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="block text-white/45">Method</span>
                    <span className="font-semibold text-white">{rec.paymentMethod}</span>
                  </div>
                  <div>
                    <span className="block text-white/45">Activated</span>
                    <span>
                      {rec.activationDate
                        ? new Date(rec.activationDate).toLocaleDateString()
                        : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-white/45">Expiry Date</span>
                    <span>
                      {rec.expiryDate ? new Date(rec.expiryDate).toLocaleDateString() : '—'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="font-mono text-purple-300/70">
                    Purchase Date: {new Date(rec.createdAt).toLocaleString()}
                    {rec.receiptId ? ` • Receipt: ${rec.receiptId}` : ''}
                  </span>
                  {rec.receiptId && (
                    <a
                      href={`/api/vip/receipts/${encodeURIComponent(rec.receiptId)}?format=txt${
                        previewMode ? '&preview=demo' : ''
                      }`}
                      className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/35 text-emerald-200 font-bold inline-flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Receipt (.TXT)</span>
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between text-xs pt-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-full bg-white/10 disabled:opacity-40 flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            <span className="text-purple-200/80">
              Page {page} of {totalPages} ({total} total)
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-full bg-white/10 disabled:opacity-40 flex items-center gap-1"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Recent Checkout Orders (Pending / Failed / Refunded traceability) */}
        {orders.length > 0 && (
          <section className="rounded-3xl bg-[#140B2F]/90 border border-purple-500/25 p-4 space-y-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-purple-200/80">
              {isUr ? 'حالیہ VIP ادائیگی آرڈرز' : 'Recent VIP Checkout Orders'}
            </h2>
            <div className="space-y-1.5 text-[11px]">
              {orders.slice(0, 8).map((o) => (
                <div
                  key={o.orderId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-black/25 px-3 py-2 border border-white/5"
                >
                  <div>
                    <span className="font-mono font-bold text-white">{o.orderId}</span>{' '}
                    <span className="text-purple-200">
                      • {o.planName} ({o.orderType})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-300">
                      {o.currency} ${o.amount.toFixed(2)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/10 uppercase text-[9px] font-black">
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
