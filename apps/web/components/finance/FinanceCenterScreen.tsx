'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bell,
  Settings,
  Search,
  Coins,
  Gift,
  Star,
  Crown,
  ShoppingBag,
  RotateCcw,
  FileText,
  Download,
  ChevronRight,
  Lock,
  ShieldCheck,
  Filter,
  Globe,
  X,
} from 'lucide-react';
import type { FinanceLedgerItem, FinancialReceiptRecord } from '@/lib/receipts';
import { ReceiptDetailView } from '@/components/finance/ReceiptDetailView';

interface FinanceCenterScreenProps {
  initialPreviewDemo?: boolean;
  initialLang?: string;
}

const CATEGORY_TABS = [
  { id: 'all', en: 'All', ur: 'سب' },
  { id: 'topup', en: 'Top-ups', ur: 'ٹاپ اپ' },
  { id: 'gift_sent', en: 'Gifts', ur: 'تحائف' },
  { id: 'earnings', en: 'Host Earnings', ur: 'ہوسٹ کمائی' },
  { id: 'vip', en: 'VIP', ur: 'وی آئی پی' },
  { id: 'store_purchase', en: 'Store', ur: 'اسٹور' },
  { id: 'refunds', en: 'Refunds & Reversals', ur: 'واپسی اور منسوخی' },
  { id: 'wallet_adjustment', en: 'Adjustments', ur: 'ایڈجسٹمنٹ' },
];

export function FinanceCenterScreen({
  initialPreviewDemo = false,
  initialLang = 'en',
}: FinanceCenterScreenProps) {
  const [isUrdu, setIsUrdu] = useState<boolean>(initialLang === 'ur');
  const [isPreviewDemo, setIsPreviewDemo] = useState<boolean>(initialPreviewDemo);
  const [authUser, setAuthUser] = useState<any>(null);
  const [activeMode, setActiveMode] = useState<'receipts' | 'export'>('receipts');

  // Filter & pagination state
  const [category, setCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [preset, setPreset] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const [historyItems, setHistoryItems] = useState<FinanceLedgerItem[]>([]);
  const [receiptsList, setReceiptsList] = useState<FinancialReceiptRecord[]>([]);
  const [pagination, setPagination] = useState<{ page: number; totalPages: number; total: number }>({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const sessRes = await fetch('/api/auth/session', { cache: 'no-store' });
      const sessJson = await sessRes.json().catch(() => ({}));
      const u = sessJson?.user || null;
      setAuthUser(u);

      const useDemo = isPreviewDemo || !u;
      if (!u && !isPreviewDemo) {
        setIsPreviewDemo(true);
      }

      const qs = new URLSearchParams({
        page: String(page),
        limit: '12',
      });
      if (useDemo) qs.set('preview', 'demo');
      if (category !== 'all') qs.set('category', category);
      if (statusFilter !== 'all') qs.set('status', statusFilter);
      if (preset !== 'all') qs.set('preset', preset);
      if (fromDate) qs.set('fromDate', fromDate);
      if (toDate) qs.set('toDate', toDate);
      if (search.trim()) qs.set('search', search.trim());

      if (activeMode === 'receipts') {
        const res = await fetch(`/api/finance/history?${qs.toString()}`, { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setErrorMsg(data.error || 'Unable to load financial history.');
        } else {
          setHistoryItems(data.items || []);
          setSummary(data.summary || null);
          setPagination({
            page: data.pagination?.page || 1,
            totalPages: data.pagination?.totalPages || 1,
            total: data.pagination?.total || 0,
          });
        }
      } else {
        const res = await fetch(`/api/finance/receipts?${qs.toString()}`, { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setErrorMsg(data.error || 'Unable to load exportable receipts.');
        } else {
          setReceiptsList(data.receipts || []);
          setPagination({
            page: data.pagination?.page || 1,
            totalPages: data.pagination?.totalPages || 1,
            total: data.pagination?.total || 0,
          });
        }
      }
    } catch {
      setErrorMsg('Network error loading financial records.');
    } finally {
      setLoading(false);
    }
  }, [activeMode, category, statusFilter, preset, fromDate, toDate, search, page, isPreviewDemo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isFinanceAdmin =
    authUser?.role === 'finance_admin' || authUser?.role === 'super_admin';

  const getCategoryVisual = (cat: string) => {
    switch (cat) {
      case 'topup':
        return {
          icon: <Coins className="w-5 h-5 text-amber-300" />,
          bg: 'bg-amber-500/20 border-amber-400/40',
        };
      case 'gift_sent':
        return {
          icon: <Gift className="w-5 h-5 text-pink-300" />,
          bg: 'bg-[#ff2d78]/20 border-[#ff2d78]/40',
        };
      case 'host_earning':
      case 'points_credit':
        return {
          icon: <Star className="w-5 h-5 text-amber-300" />,
          bg: 'bg-yellow-500/20 border-yellow-400/40',
        };
      case 'vip_purchase':
      case 'vip_renewal':
        return {
          icon: <Crown className="w-5 h-5 text-purple-200" />,
          bg: 'bg-purple-500/25 border-purple-400/40',
        };
      case 'store_purchase':
        return {
          icon: <ShoppingBag className="w-5 h-5 text-cyan-300" />,
          bg: 'bg-cyan-500/20 border-cyan-400/40',
        };
      case 'refund':
      case 'reversal':
        return {
          icon: <RotateCcw className="w-5 h-5 text-rose-300" />,
          bg: 'bg-rose-500/20 border-rose-400/40',
        };
      default:
        return {
          icon: <FileText className="w-5 h-5 text-emerald-300" />,
          bg: 'bg-emerald-500/20 border-emerald-400/40',
        };
    }
  };

  const renderPrimaryDelta = (item: FinanceLedgerItem) => {
    if (item.txCategory === 'topup') {
      const total = item.coinQuantity + item.bonusCoinQuantity;
      return {
        text: `+${total.toLocaleString()} Coins`,
        sub: item.paymentAmount > 0 && item.currency !== 'NONE' ? `${item.currency} ${item.paymentAmount.toFixed(2)}` : null,
        color: 'text-emerald-400',
      };
    }
    if (item.txCategory === 'gift_sent' || item.txCategory === 'store_purchase') {
      return {
        text: `-${item.coinQuantity.toLocaleString()} Coins`,
        sub: null,
        color: 'text-rose-300',
      };
    }
    if (item.txCategory === 'host_earning' || item.txCategory === 'points_credit') {
      return {
        text: `+${item.pointsQuantity.toLocaleString()} Points`,
        sub: item.platformShareCoins > 0 ? `30% Platform: ${item.platformShareCoins.toLocaleString()}` : null,
        color: 'text-amber-300',
      };
    }
    if (item.txCategory === 'vip_purchase' || item.txCategory === 'vip_renewal') {
      return {
        text:
          item.coinQuantity > 0
            ? `-${item.coinQuantity.toLocaleString()} Coins`
            : `${item.currency} ${item.paymentAmount.toFixed(2)}`,
        sub: null,
        color: 'text-purple-300',
      };
    }
    if (item.coinQuantity > 0) {
      return {
        text: `${item.coinQuantity.toLocaleString()} Coins`,
        sub: null,
        color: item.txCategory === 'refund' ? 'text-emerald-300' : 'text-amber-200',
      };
    }
    return {
      text: `${item.pointsQuantity.toLocaleString()} Points`,
      sub: null,
      color: 'text-amber-200',
    };
  };

  return (
    <div
      dir={isUrdu ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#0c041c] text-white pb-20"
      style={{
        backgroundImage:
          'radial-gradient(circle at 20% 0%, rgba(255,45,120,0.18), transparent 45%), radial-gradient(circle at 80% 15%, rgba(139,92,246,0.22), transparent 45%)',
      }}
    >
      <div className="max-w-4xl mx-auto px-4 pt-4">
        {/* Top App Bar matching Module 7.10 Reference */}
        <header className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <Link
              href={isPreviewDemo ? '/wallet?preview=demo' : '/wallet'}
              className="w-9 h-9 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center"
              aria-label="Back to Wallet"
            >
              <ArrowLeft className={`w-4 h-4 ${isUrdu ? 'rotate-180' : ''}`} />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#ff2d78] to-purple-500 flex items-center justify-center font-black text-sm shadow-[0_0_16px_rgba(255,45,120,0.5)]">
                P
              </div>
              <span className="text-lg font-black tracking-tight">Popo Live</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsUrdu((prev) => !prev)}
              data-testid="finance-lang-toggle"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-extrabold"
            >
              <Globe className="w-3.5 h-3.5 text-amber-300" />
              <span>{isUrdu ? 'EN' : 'اردو'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowFilters((p) => !p)}
              className="w-9 h-9 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center"
              aria-label="Toggle Filters"
            >
              <Settings className="w-4 h-4 text-white/80" />
            </button>
            <Link
              href={isFinanceAdmin ? '/admin/finance?tab=reports' : '/wallet'}
              className="w-9 h-9 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center"
              aria-label="Finance Notifications"
            >
              <Bell className="w-4 h-4 text-white/80" />
            </Link>
          </div>
        </header>

        {/* Page Heading */}
        <div className="text-center mb-4">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {isUrdu ? 'رسیدیں اور مالیات' : 'Receipts & Finance'}
          </h1>
          <p className="text-xs text-white/60 mt-1">
            {isUrdu
              ? 'مستند لین دین کا ریکارڈ — سکے، پوائنٹس اور ادائیگیاں الگ الگ'
              : 'Verified transaction records — Cash, Coins & Non-Cash Host Points kept strictly separate'}
          </p>
        </div>

        {/* Reference Glowing Pink Pill Toggle Switch ("Receipts" | "Export") */}
        <div className="max-w-md mx-auto mb-5 p-1 rounded-2xl bg-[#180c33] border border-purple-500/30 grid grid-cols-2 gap-1 shadow-xl">
          <button
            type="button"
            data-testid="tab-receipts"
            onClick={() => {
              setActiveMode('receipts');
              setPage(1);
            }}
            className={`py-2.5 rounded-xl text-sm font-extrabold transition ${
              activeMode === 'receipts'
                ? 'bg-gradient-to-r from-[#ff2d78] to-[#ff5e9c] text-white shadow-[0_0_20px_rgba(255,45,120,0.45)]'
                : 'text-white/65 hover:text-white'
            }`}
          >
            {isUrdu ? 'رسیدیں اور ہسٹری' : 'Receipts'}
          </button>
          <button
            type="button"
            data-testid="tab-export"
            onClick={() => {
              setActiveMode('export');
              setPage(1);
            }}
            className={`py-2.5 rounded-xl text-sm font-extrabold transition ${
              activeMode === 'export'
                ? 'bg-gradient-to-r from-[#ff2d78] to-[#ff5e9c] text-white shadow-[0_0_20px_rgba(255,45,120,0.45)]'
                : 'text-white/65 hover:text-white'
            }`}
          >
            {isUrdu ? 'پی ڈی ایف / ایکسپورٹ' : 'Export'}
          </button>
        </div>

        {/* Separate Metric Summary Strip (never merges coins + points + cash) */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
            <div className="rounded-2xl bg-[#150a2c] border border-purple-500/25 p-3">
              <div className="text-[10px] font-bold text-white/50 uppercase">
                {isUrdu ? 'ٹاپ اپ سکے' : 'Top-up Coins'}
              </div>
              <div className="text-base font-black text-amber-300 mt-0.5">
                {Number(summary.totalTopupCoinsReceived || 0).toLocaleString()}
              </div>
            </div>
            <div className="rounded-2xl bg-[#150a2c] border border-purple-500/25 p-3">
              <div className="text-[10px] font-bold text-white/50 uppercase">
                {isUrdu ? 'تحائف کے سکے' : 'Gift Coins Sent'}
              </div>
              <div className="text-base font-black text-pink-300 mt-0.5">
                {Number(summary.totalGiftCoinsSent || 0).toLocaleString()}
              </div>
            </div>
            <div className="rounded-2xl bg-[#150a2c] border border-purple-500/25 p-3">
              <div className="text-[10px] font-bold text-white/50 uppercase">
                {isUrdu ? 'ہوسٹ پوائنٹس (نان کیش)' : 'Host Points (Non-Cash)'}
              </div>
              <div className="text-base font-black text-yellow-300 mt-0.5">
                {Number(summary.totalHostPointsCredited || 0).toLocaleString()}
              </div>
            </div>
            <div className="rounded-2xl bg-[#150a2c] border border-purple-500/25 p-3">
              <div className="text-[10px] font-bold text-white/50 uppercase">
                {isUrdu ? 'مستند رسیدیں' : 'Issued Receipts'}
              </div>
              <div className="text-base font-black text-emerald-300 mt-0.5">
                {Number(summary.eligibleReceiptsCount || 0).toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Search & Filters Bar */}
        <div className="mb-4 space-y-2.5">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-white/45 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder={isUrdu ? 'ٹرانزیکشن آئی ڈی یا رسید نمبر تلاش کریں...' : 'Search by Transaction ID, Receipt # or Title...'}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#160a2e] border border-purple-500/30 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#ff2d78]"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((p) => !p)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-[#160a2e] border border-purple-500/30 text-xs font-bold hover:border-[#ff2d78]"
            >
              <Filter className="w-3.5 h-3.5 text-[#ff2d78]" />
              <span>{isUrdu ? 'فلٹرز' : 'Filters'}</span>
            </button>
          </div>

          {/* Horizontal Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setCategory(tab.id);
                  setPage(1);
                }}
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-[11px] font-extrabold border transition ${
                  category === tab.id
                    ? 'bg-[#ff2d78]/20 border-[#ff2d78] text-[#ff9ec1]'
                    : 'bg-white/[0.04] border-white/10 text-white/65 hover:text-white'
                }`}
              >
                {isUrdu ? tab.ur : tab.en}
              </button>
            ))}
          </div>

          {/* Expandable Status & Date Filter Panel */}
          {showFilters && (
            <div className="rounded-2xl bg-[#160a2e] border border-purple-500/30 p-3.5 grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="text-[10px] font-bold text-white/55 block mb-1">
                  {isUrdu ? 'اسٹیٹس' : 'Status'}
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-[#0e0522] border border-purple-500/30 rounded-xl px-2.5 py-2 text-xs text-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="successful">Successful</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                  <option value="reversed">Reversed</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/55 block mb-1">
                  {isUrdu ? 'مدت' : 'Date Preset'}
                </label>
                <select
                  value={preset}
                  onChange={(e) => {
                    setPreset(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-[#0e0522] border border-purple-500/30 rounded-xl px-2.5 py-2 text-xs text-white"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="last_7d">Last 7 Days</option>
                  <option value="last_30d">Last 30 Days</option>
                  <option value="this_month">This Month</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/55 block mb-1">From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setPreset('custom');
                    setFromDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-[#0e0522] border border-purple-500/30 rounded-xl px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/55 block mb-1">To</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setPreset('custom');
                    setToDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-[#0e0522] border border-purple-500/30 rounded-xl px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-200">
            {errorMsg}
          </div>
        )}

        {/* Mode 1: Transaction History & Receipt Cards */}
        {activeMode === 'receipts' ? (
          <div className="space-y-3" data-testid="finance-history-list">
            {loading ? (
              <div className="p-8 text-center text-xs text-white/55">Loading financial history...</div>
            ) : historyItems.length === 0 ? (
              <div className="rounded-3xl bg-[#160a2e] border border-purple-500/20 p-8 text-center">
                <p className="text-sm font-bold text-white/80">
                  {isUrdu ? 'کوئی ٹرانزیکشن ریکارڈ نہیں ملا' : 'No matching financial records found'}
                </p>
                <p className="text-xs text-white/50 mt-1">
                  {isUrdu ? 'فلٹرز تبدیل کر کے دوبارہ کوشش کریں۔' : 'Adjust your search or filter selections.'}
                </p>
              </div>
            ) : (
              historyItems.map((item) => {
                const vis = getCategoryVisual(item.txCategory);
                const delta = renderPrimaryDelta(item);
                return (
                  <div
                    key={`${item.sourceTable}:${item.recordId}`}
                    data-testid={`history-row-${item.recordId}`}
                    className="rounded-2xl bg-gradient-to-r from-[#1a0f35]/95 to-[#130926]/95 border border-purple-500/25 hover:border-[#ff2d78]/45 p-4 flex items-center justify-between gap-3 transition shadow-lg"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center flex-shrink-0 ${vis.bg}`}>
                        {vis.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold text-white truncate">
                          {isUrdu ? item.titleUr : item.title}
                        </div>
                        <div className="text-[11px] text-white/55 truncate">
                          {new Date(item.issuedAt).toLocaleString()} • {item.recordId}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                              item.status === 'successful'
                                ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300'
                                : item.status === 'refunded'
                                ? 'bg-amber-500/15 border-amber-400/30 text-amber-300'
                                : item.status === 'reversed' || item.status === 'failed'
                                ? 'bg-rose-500/15 border-rose-400/30 text-rose-300'
                                : 'bg-white/10 border-white/20 text-white/75'
                            }`}
                          >
                            {item.status.toUpperCase()}
                          </span>
                          {item.receiptEligible ? (
                            <span className="text-[10px] font-bold text-amber-300">
                              {item.receiptNumber}
                            </span>
                          ) : (
                            <span className="text-[10px] text-white/45">
                              {isUrdu ? 'کوئی رسید جاری نہیں ہوئی' : 'Status Record Only (No Receipt)'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      <div className="text-right">
                        <div className={`text-sm font-black ${delta.color}`}>{delta.text}</div>
                        {delta.sub && <div className="text-[10px] text-white/55 font-semibold">{delta.sub}</div>}
                      </div>
                      {item.receiptEligible && item.receiptId ? (
                        <button
                          type="button"
                          onClick={() => setSelectedReceiptId(item.receiptId)}
                          data-testid={`open-receipt-${item.receiptId}`}
                          className="w-8 h-8 rounded-xl bg-white/10 hover:bg-[#ff2d78] flex items-center justify-center transition"
                          title={isUrdu ? 'رسید دیکھیں' : 'View Official Receipt'}
                        >
                          <ChevronRight className={`w-4 h-4 ${isUrdu ? 'rotate-180' : ''}`} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Mode 2: Receipt PDF Downloads & Admin Export Notice */
          <div className="space-y-4">
            <div className="rounded-3xl bg-[#160a2e] border border-purple-500/30 p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#ff2d78]/20 border border-[#ff2d78]/40 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-[#ff85b3]" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-white">
                    {isUrdu ? 'مستند پی ڈی ایف رسیدیں' : 'Personal Receipt PDF Downloads'}
                  </h2>
                  <p className="text-xs text-white/60 mt-0.5">
                    {isUrdu
                      ? 'اپنی تمام تصدیق شدہ رسیدیں پی ڈی ایف فارمیٹ میں ڈاؤن لوڈ یا پرنٹ کریں۔'
                      : 'Download or print verified official PDF receipts for your successful, refunded, or reversed transactions.'}
                  </p>
                </div>
              </div>

              {isFinanceAdmin ? (
                <Link
                  href="/admin/finance?tab=reports"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff2d78] to-[#ec4899] text-xs font-extrabold text-white shadow-lg"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Open Finance Admin CSV/XLSX/PDF Export</span>
                </Link>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-white/60">
                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                  <span>Platform Accounting Exports: Finance Admin Only</span>
                </div>
              )}
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-white/55">Loading official receipts...</div>
            ) : receiptsList.length === 0 ? (
              <div className="rounded-3xl bg-[#160a2e] border border-purple-500/20 p-8 text-center text-xs text-white/55">
                No issued receipts found for your filter criteria.
              </div>
            ) : (
              receiptsList.map((r) => (
                <div
                  key={r.receiptId}
                  className="rounded-2xl bg-[#190e33] border border-purple-500/25 p-4 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-amber-300">{r.receiptNumber}</span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white/10 text-white/80">
                        {r.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm font-extrabold text-white mt-0.5">
                      {isUrdu ? r.titleUr : r.title}
                    </div>
                    <div className="text-[11px] text-white/55 mt-0.5">
                      {new Date(r.issuedAt).toLocaleString()} • {r.itemDetailSummary}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedReceiptId(r.receiptId)}
                      className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold"
                    >
                      {isUrdu ? 'دیکھیں' : 'View'}
                    </button>
                    <a
                      href={`/api/finance/receipts/${encodeURIComponent(r.receiptId)}/pdf${isPreviewDemo ? '?preview=demo' : ''}`}
                      download
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#ff2d78] hover:brightness-110 text-xs font-extrabold text-white"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Server Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="mt-5 flex items-center justify-between text-xs">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-xl bg-white/10 disabled:opacity-35 font-bold"
            >
              {isUrdu ? 'پچھلا' : 'Previous'}
            </button>
            <span className="text-white/65 font-semibold">
              Page {pagination.page} / {pagination.totalPages} ({pagination.total} records)
            </span>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-xl bg-white/10 disabled:opacity-35 font-bold"
            >
              {isUrdu ? 'اگلا' : 'Next'}
            </button>
          </div>
        )}
      </div>

      {/* Interactive Receipt Detail Modal */}
      {selectedReceiptId && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm overflow-y-auto p-4 flex items-start justify-center sm:items-center">
          <div className="relative w-full max-w-2xl my-6">
            <button
              type="button"
              onClick={() => setSelectedReceiptId(null)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-[#ff2d78] text-white flex items-center justify-center shadow-lg"
              aria-label="Close receipt modal"
            >
              <X className="w-4 h-4" />
            </button>
            <ReceiptDetailView
              receiptOrTxId={selectedReceiptId}
              isPreviewDemo={isPreviewDemo}
              isUrdu={isUrdu}
              onClose={() => setSelectedReceiptId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
