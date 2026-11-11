'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Globe,
  Search,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  ChevronLeft,
  ChevronRight,
  Coins,
  Star,
  Info,
} from 'lucide-react';
import type {
  CoinTransactionRecord,
  PointsTransactionRecord,
} from '@/lib/wallet';

const DEFAULT_DEMO_WALLET_USER_ID = 'user_wallet_demo_701';

interface WalletHistoryScreenProps {
  mode: 'coins' | 'points';
  initialUserId?: string;
  initialLanguage?: 'en' | 'ur';
  isPreviewDemo?: boolean;
}

export default function WalletHistoryScreen({
  mode,
  initialUserId,
  initialLanguage = 'en',
  isPreviewDemo = false,
}: WalletHistoryScreenProps) {
  const [lang, setLang] = useState<'en' | 'ur'>(initialLanguage);
  const isRtl = lang === 'ur';

  const userId = initialUserId || DEFAULT_DEMO_WALLET_USER_ID;
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [coinTxs, setCoinTxs] = useState<CoinTransactionRecord[]>([]);
  const [pointsTxs, setPointsTxs] = useState<PointsTransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const querySuffix = isPreviewDemo ? '&preview=demo' : '';

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const endpoint = mode === 'coins' ? '/api/wallet/coins/history' : '/api/wallet/points/history';
      const params = new URLSearchParams({
        userId,
        page: String(page),
        limit: '10',
      });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (isPreviewDemo) params.set('preview', 'demo');

      const res = await fetch(`${endpoint}?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        if (mode === 'coins') {
          setCurrentBalance(data.currentCoins ?? 0);
          setCoinTxs(data.transactions || []);
        } else {
          setCurrentBalance(data.currentPoints ?? 0);
          setPointsTxs(data.transactions || []);
        }
        setTotalPages(data.pagination?.totalPages ?? 1);
        setTotalItems(data.pagination?.total ?? 0);
      }
    } catch (err) {
      console.error('History fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [mode, userId, page, statusFilter, searchQuery, isPreviewDemo]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const statusChips = [
    { id: 'all', en: 'All', ur: 'سب' },
    { id: 'completed', en: 'Completed', ur: 'مکمل' },
    { id: 'pending', en: 'Pending', ur: 'زیر التواء' },
    { id: 'failed', en: 'Failed', ur: 'ناکام' },
    { id: 'reversed', en: 'Reversed', ur: 'واپس شدہ' },
  ];

  const renderStatusPill = (status: string) => {
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
          <CheckCircle2 className="w-3 h-3" />
          {isRtl ? 'مکمل' : 'Completed'}
        </span>
      );
    }
    if (status === 'failed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/25">
          <XCircle className="w-3 h-3" />
          {isRtl ? 'ناکام' : 'Failed'}
        </span>
      );
    }
    if (status === 'reversed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
          <RotateCcw className="w-3 h-3" />
          {isRtl ? 'واپس شدہ' : 'Reversed'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/25">
        <Clock className="w-3 h-3" />
        {isRtl ? 'زیر التواء' : 'Pending'}
      </span>
    );
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="relative w-full max-w-md md:max-w-2xl mx-auto min-h-screen bg-[#0c041c] text-white flex flex-col justify-between shadow-2xl border-x border-purple-800/30"
    >
      <div className="p-4 flex-1">
        {/* Header */}
        <header className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Link
              href={`/wallet?userId=${encodeURIComponent(userId)}${querySuffix}&lang=${lang}`}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition"
            >
              <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-white">
                {mode === 'coins'
                  ? isRtl
                    ? 'سکوں کی ہسٹری'
                    : 'Coin History'
                  : isRtl
                  ? 'پوائنٹس کی ہسٹری'
                  : 'Points History'}
              </h1>
              <p className="text-[11px] text-white/50">
                {mode === 'coins'
                  ? isRtl
                    ? 'تمام سکوں کے ٹاپ اپ، تحائف اور بیلنس تبدیلیاں'
                    : 'Complete viewer coin ledger & status audit'
                  : isRtl
                  ? 'اہل تحائف سے 70% ہوسٹ پوائنٹس کی کمائی'
                  : 'Host points earning ledger (70% gift share)'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
            className="h-8 px-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-1.5 text-xs font-bold text-[#ff2d78]"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? 'UR' : 'EN'}</span>
          </button>
        </header>

        {/* Current Balance Summary Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-[#1a0d36] to-[#230e42] border border-purple-500/30 p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center">
              {mode === 'coins' ? (
                <Coins className="w-5 h-5 text-amber-400" />
              ) : (
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              )}
            </div>
            <div>
              <div className="text-[11px] text-white/60 font-semibold">
                {mode === 'coins'
                  ? isRtl
                    ? 'موجودہ سکے'
                    : 'Available Coin Balance'
                  : isRtl
                  ? 'موجودہ پوائنٹس'
                  : 'Available Earnings Points'}
              </div>
              <div className="text-2xl font-black text-white tabular-nums">
                {currentBalance.toLocaleString()}
              </div>
            </div>
          </div>

          <Link
            href={
              mode === 'coins'
                ? `/wallet/points-history?userId=${encodeURIComponent(userId)}${querySuffix}&lang=${lang}`
                : `/wallet/coin-history?userId=${encodeURIComponent(userId)}${querySuffix}&lang=${lang}`
            }
            className="px-3.5 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-purple-200 transition"
          >
            {mode === 'coins'
              ? isRtl
                ? 'پوائنٹس دیکھیں'
                : 'Points History'
              : isRtl
              ? 'سکے دیکھیں'
              : 'Coin History'}
          </Link>
        </div>

        {/* Search & Status Filters */}
        <div className="mb-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-white/40 absolute top-1/2 -translate-y-1/2 start-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder={
                isRtl
                  ? 'ٹرانزیکشن آئی ڈی یا تفصیل تلاش کریں...'
                  : 'Search by Transaction ID, source or reference...'
              }
              className="w-full bg-[#150a2c] border border-purple-500/25 rounded-2xl ps-10 pe-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#ff2d78]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {statusChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => {
                  setStatusFilter(chip.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition ${
                  statusFilter === chip.id
                    ? 'bg-[#ff2d78] text-white shadow-[0_0_12px_rgba(255,45,120,0.4)]'
                    : 'bg-[#170c2e] text-white/60 border border-purple-500/20 hover:text-white'
                }`}
              >
                {isRtl ? chip.ur : chip.en}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction List */}
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <div className="w-7 h-7 border-2 border-[#ff2d78] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (mode === 'coins' ? coinTxs : pointsTxs).length === 0 ? (
          <div className="rounded-3xl bg-[#150a2c] border border-purple-500/20 p-8 text-center">
            <p className="text-sm text-white/60 font-semibold">
              {isRtl ? 'کوئی ریکارڈ نہیں ملا' : 'No matching transactions found.'}
            </p>
          </div>
        ) : mode === 'coins' ? (
          <div className="space-y-3">
            {coinTxs.map((tx) => (
              <div
                key={tx.transactionId}
                className="rounded-2xl bg-[#150a2c] border border-purple-500/20 p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-md">
                      {tx.transactionId}
                    </span>
                    <div className="text-sm font-bold text-white mt-1.5">
                      {tx.description || tx.transactionType}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-base font-black tabular-nums ${
                        tx.status === 'failed'
                          ? 'text-white/40 line-through'
                          : tx.direction === 'credit'
                          ? 'text-emerald-400'
                          : 'text-pink-400'
                      }`}
                    >
                      {tx.direction === 'credit' ? '+' : '-'}
                      {tx.coinAmount.toLocaleString()}
                    </div>
                    <div className="mt-1">{renderStatusPill(tx.status)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-[11px]">
                  <div>
                    <span className="text-white/40 block">{isRtl ? 'سابقہ بیلنس' : 'Previous'}</span>
                    <span className="font-bold text-white/80 tabular-nums">
                      {tx.previousBalance.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/40 block">{isRtl ? 'نیا بیلنس' : 'Updated'}</span>
                    <span className="font-bold text-white tabular-nums">
                      {tx.newBalance.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-white/40 block">{isRtl ? 'قسم' : 'Type'}</span>
                    <span className="font-bold text-purple-300 uppercase text-[10px]">
                      {tx.transactionType}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-white/40 pt-1">
                  <span>{tx.referenceId ? `Ref: ${tx.referenceId}` : ''}</span>
                  <span>{new Date(tx.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {pointsTxs.map((tx) => (
              <div
                key={tx.transactionId}
                className="rounded-2xl bg-[#150a2c] border border-purple-500/20 p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md">
                      {tx.transactionId}
                    </span>
                    <div className="text-sm font-bold text-white mt-1.5">{tx.giftSource}</div>
                    <div className="text-[11px] text-white/60">
                      {tx.senderName ? `Sender: ${tx.senderName}` : 'Platform Credit'} •{' '}
                      <span className="text-purple-300 font-semibold">
                        {tx.sharePercentageApplied}% Host Share
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-base font-black tabular-nums ${
                        tx.direction === 'credit' ? 'text-amber-400' : 'text-rose-400'
                      }`}
                    >
                      {tx.direction === 'credit' ? '+' : '-'}
                      {tx.pointsAmount.toLocaleString()} pts
                    </div>
                    <div className="mt-1">{renderStatusPill(tx.status)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-[11px]">
                  <div>
                    <span className="text-white/40 block">{isRtl ? 'سابقہ پوائنٹس' : 'Prev Points'}</span>
                    <span className="font-bold text-white/80 tabular-nums">
                      {tx.previousBalance.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/40 block">{isRtl ? 'نیا پوائنٹس' : 'Updated Points'}</span>
                    <span className="font-bold text-white tabular-nums">
                      {tx.newBalance.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-white/40 block">{isRtl ? 'اصل تحفہ' : 'Gift Coins'}</span>
                    <span className="font-bold text-amber-300 tabular-nums">
                      {tx.sourceGiftCoins.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-white/40 pt-1">
                  <span>{tx.referenceId ? `Ref: ${tx.referenceId}` : ''}</span>
                  <span>{new Date(tx.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalItems > 0 && (
          <div className="mt-5 flex items-center justify-between bg-[#150a2c] border border-purple-500/20 rounded-2xl px-4 py-2.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 text-xs font-bold text-white disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{isRtl ? 'پچھلا' : 'Prev'}</span>
            </button>
            <span className="text-xs text-white/70 font-semibold">
              {isRtl ? `صفحہ ${page} از ${totalPages}` : `Page ${page} of ${totalPages} (${totalItems})`}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="flex items-center gap-1 text-xs font-bold text-white disabled:opacity-30"
            >
              <span>{isRtl ? 'اگلا' : 'Next'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Rule Note for Points */}
        {mode === 'points' && (
          <div className="mt-4 p-3 rounded-2xl bg-purple-950/40 border border-purple-500/20 flex items-start gap-2 text-[11px] text-purple-200/75">
            <Info className="w-4 h-4 text-[#ff2d78] flex-shrink-0 mt-0.5" />
            <span>
              {isRtl
                ? 'پوائنٹس صرف میزبان کی کمائی کا بیلنس ہے اور براہ راست نقد رقم میں تبدیل نہیں ہوتا۔ رقم نکلوانے کے قواعد کریئیٹر بزنس ماڈیولز میں ہوں گے۔'
                : 'Points represent host gift earnings (70% of gift coins) and remain separate from viewer Coins. Payout rules belong to later Creator Business modules.'}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Watermark */}
      <footer className="py-4 px-4 flex flex-col items-center justify-center bg-[#090216]">
        <span className="px-6 py-1 rounded-full bg-gradient-to-r from-[#ff1e7a] to-[#ec4899] text-white font-black text-xs">
          P7.1
        </span>
        <span className="mt-1 text-xs font-bold text-white/80">
          {isRtl ? 'سکے اور پوائنٹس ہسٹری' : 'Coins and Points History'}
        </span>
      </footer>
    </div>
  );
}
