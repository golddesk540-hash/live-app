'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Bell,
  Globe,
  RefreshCw,
  ChevronRight,
  Hourglass,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Wifi,
  WifiOff,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  Info,
  Coins,
  Gift,
  Crown,
  Award,
  ShoppingBag,
} from 'lucide-react';
import type {
  WalletBalance,
  CoinTransactionRecord,
  PointsTransactionRecord,
} from '@/lib/wallet';

const DEFAULT_DEMO_WALLET_USER_ID = 'user_wallet_demo_701';

interface WalletScreenProps {
  initialUserId?: string;
  initialLanguage?: 'en' | 'ur';
  isPreviewDemo?: boolean;
}

export default function WalletScreen({
  initialUserId,
  initialLanguage = 'en',
  isPreviewDemo = false,
}: WalletScreenProps) {
  const [lang, setLang] = useState<'en' | 'ur'>(initialLanguage);
  const isRtl = lang === 'ur';

  const [userId, setUserId] = useState<string>(initialUserId || DEFAULT_DEMO_WALLET_USER_ID);
  const [activeTab, setActiveTab] = useState<'coins' | 'points'>('coins');
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [recentCoinTxs, setRecentCoinTxs] = useState<CoinTransactionRecord[]>([]);
  const [recentPointsTxs, setRecentPointsTxs] = useState<PointsTransactionRecord[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [sseConnected, setSseConnected] = useState<boolean>(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  const querySuffix = isPreviewDemo ? `&preview=demo` : '';

  const loadWalletData = useCallback(
    async (uid: string, forceFresh: boolean = false) => {
      try {
        if (forceFresh) setIsRefreshing(true);
        const [balRes, coinHistRes, ptsHistRes] = await Promise.all([
          fetch(`/api/wallet/balance?userId=${encodeURIComponent(uid)}${forceFresh ? '&fresh=true' : ''}${querySuffix}`),
          fetch(`/api/wallet/coins/history?userId=${encodeURIComponent(uid)}&limit=5${querySuffix}`),
          fetch(`/api/wallet/points/history?userId=${encodeURIComponent(uid)}&limit=5${querySuffix}`),
        ]);

        const balData = await balRes.json();
        if (balData.success && balData.wallet) {
          setWallet(balData.wallet);
        }

        const coinData = await coinHistRes.json();
        if (coinData.success && Array.isArray(coinData.transactions)) {
          setRecentCoinTxs(coinData.transactions);
        }

        const ptsData = await ptsHistRes.json();
        if (ptsData.success && Array.isArray(ptsData.transactions)) {
          setRecentPointsTxs(ptsData.transactions);
        }
      } catch (err) {
        console.error('Failed to load wallet data:', err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [querySuffix]
  );

  // Initial session resolution if no explicit userId passed
  useEffect(() => {
    if (initialUserId) {
      setUserId(initialUserId);
      loadWalletData(initialUserId);
      return;
    }

    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => {
        const resolvedId = data?.user?.id || DEFAULT_DEMO_WALLET_USER_ID;
        setUserId(resolvedId);
        loadWalletData(resolvedId);
      })
      .catch(() => {
        loadWalletData(DEFAULT_DEMO_WALLET_USER_ID);
      });
  }, [initialUserId, loadWalletData]);

  // Real-Time Wallet SSE Stream + Auto Reconnect Balance Recovery
  useEffect(() => {
    if (!userId) return;

    const connectSse = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const url = `/api/wallet/events?userId=${encodeURIComponent(userId)}${querySuffix}`;
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.addEventListener('connected', (e: MessageEvent) => {
        setSseConnected(true);
        try {
          const parsed = JSON.parse(e.data);
          if (parsed.restoredWallet) {
            setWallet(parsed.restoredWallet);
          }
        } catch {}
      });

      es.addEventListener('wallet:coin_balance_updated', (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          setWallet((prev) =>
            prev ? { ...prev, coins: parsed.coins, updatedAt: new Date().toISOString() } : prev
          );
          loadWalletData(userId, true);
        } catch {}
      });

      es.addEventListener('wallet:points_balance_updated', (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          setWallet((prev) =>
            prev ? { ...prev, points: parsed.points, updatedAt: new Date().toISOString() } : prev
          );
          loadWalletData(userId, true);
        } catch {}
      });

      es.addEventListener('wallet:transaction_completed', () => {
        loadWalletData(userId, true);
      });

      es.addEventListener('wallet:transaction_reversed', () => {
        loadWalletData(userId, true);
        setNotice({
          type: 'info',
          text: isRtl ? 'ایک لین دین ریورس کر دیا گیا ہے۔' : 'A transaction was reversed; balance restored.',
        });
        setTimeout(() => setNotice(null), 4000);
      });

      es.addEventListener('wallet:transaction_failed', () => {
        loadWalletData(userId, true);
      });

      es.onerror = () => {
        setSseConnected(false);
      };
    };

    connectSse();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [userId, querySuffix, isRtl, loadWalletData]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/wallet/refresh?preview=${isPreviewDemo ? 'demo' : 'false'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, previewDemo: isPreviewDemo }),
      });
      const data = await res.json();
      if (data.success && data.wallet) {
        setWallet(data.wallet);
        await loadWalletData(userId, true);
        setNotice({
          type: 'success',
          text: isRtl ? 'بیلنس اپڈیٹ ہو گیا' : 'Wallet balance synced from server',
        });
        setTimeout(() => setNotice(null), 2500);
      }
    } catch {
      setNotice({
        type: 'error',
        text: isRtl ? 'والیٹ ریفریش ناکام رہا' : 'Failed to refresh balance',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const displayCoins = wallet?.coins ?? 12500;
  const displayPoints = wallet?.points ?? 8420;
  const historyQueryParams = `?userId=${encodeURIComponent(userId)}${isPreviewDemo ? '&preview=demo' : ''}&lang=${lang}`;

  const renderStatusBadge = (status: string) => {
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
          <CheckCircle2 className="w-2.5 h-2.5" />
          {isRtl ? 'مکمل' : 'Completed'}
        </span>
      );
    }
    if (status === 'failed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/25">
          <XCircle className="w-2.5 h-2.5" />
          {isRtl ? 'ناکام' : 'Failed'}
        </span>
      );
    }
    if (status === 'reversed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
          <RotateCcw className="w-2.5 h-2.5" />
          {isRtl ? 'واپس شدہ' : 'Reversed'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/25">
        <Clock className="w-2.5 h-2.5" />
        {isRtl ? 'زیر التواء' : 'Pending'}
      </span>
    );
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="relative w-full max-w-md md:max-w-lg mx-auto min-h-screen bg-[#0c041c] text-white flex flex-col justify-between overflow-hidden shadow-2xl border-x border-purple-800/30"
    >
      {/* Ambient Deep Purple Neon Glow Background (Matches 07_01_coins_and_points.png) */}
      <div className="pointer-events-none absolute -top-28 -left-24 w-72 h-72 rounded-full bg-purple-700/25 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-24 w-64 h-64 rounded-full bg-[#ff2d78]/15 blur-3xl" />

      <div className="relative z-10 px-4 pt-4 pb-6 flex-1 flex flex-col">
        {/* 1. TOP BRAND BAR ("Popo Live" + Notifications + Refresh + Language Toggle) */}
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#ff2d78] via-[#d946ef] to-[#f59e0b] p-[1.5px] shadow-[0_0_14px_rgba(255,45,120,0.4)]">
              <div className="w-full h-full bg-[#15082e] rounded-[10px] flex items-center justify-center font-black text-amber-400 text-base">
                P
              </div>
            </div>
            <span className="text-lg font-black italic tracking-tight text-white">Popo Live</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleManualRefresh}
              aria-label="Refresh Wallet"
              data-testid="wallet-refresh-btn"
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 transition"
              title={isRtl ? 'ریفریش کریں' : 'Refresh balance'}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#ff2d78]' : ''}`} />
            </button>
            <Link
              href={isPreviewDemo ? '/gifts?preview=demo' : '/gifts'}
              data-testid="wallet-gift-catalog-link"
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-pink-400 transition"
              title={isRtl ? 'گفٹ کیٹلاگ دیکھیں' : 'Open Gift Catalog'}
            >
              <Gift className="w-4 h-4" />
            </Link>
            <Link
              href="/admin/finance"
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 transition"
              title={isRtl ? 'فنانس ایڈمن پینل' : 'Admin Finance Control'}
            >
              <Bell className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
              data-testid="wallet-lang-toggle"
              className="h-8 px-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-1 text-[11px] font-bold text-[#ff2d78] transition"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'UR' : 'EN'}</span>
            </button>
          </div>
        </header>

        {/* 2. WALLET TITLE + LIVE SSE SYNC INDICATOR */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold tracking-tight text-white">
              {isRtl ? 'والیٹ' : 'Wallet'}
            </h1>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                sseConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
              }`}
            >
              {sseConnected ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
              <span>{sseConnected ? (isRtl ? 'لائیو مطابقت' : 'Live Sync') : isRtl ? 'آن لائن' : 'Synced'}</span>
            </span>
          </div>

          <span className="text-[11px] text-white/50 font-mono truncate max-w-[140px]">
            ID: {userId === DEFAULT_DEMO_WALLET_USER_ID ? '701-DEMO' : userId.slice(0, 10)}
          </span>
        </div>

        {/* Status Notification Banner */}
        {notice && (
          <div
            className={`mb-3 px-3.5 py-2 rounded-2xl text-xs font-semibold flex items-center gap-2 border ${
              notice.type === 'success'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : notice.type === 'error'
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                : 'bg-purple-500/20 text-purple-200 border-purple-500/30'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{notice.text}</span>
          </div>
        )}

        {/* 3. SEGMENTED PILL TABS: Coins | Points (Exact match to 07_01_coins_and_points.png) */}
        <div className="p-1 rounded-full bg-[#170c2e] border border-purple-500/25 flex items-center mb-5 shadow-inner">
          <button
            type="button"
            data-testid="tab-coins"
            onClick={() => setActiveTab('coins')}
            className={`flex-1 py-2.5 rounded-full text-sm font-extrabold transition-all ${
              activeTab === 'coins'
                ? 'bg-gradient-to-r from-[#ff1e7a] to-[#e91e63] text-white shadow-[0_0_20px_rgba(255,30,122,0.5)]'
                : 'text-white/70 hover:text-white'
            }`}
          >
            {isRtl ? 'سکے (Coins)' : 'Coins'}
          </button>
          <button
            type="button"
            data-testid="tab-points"
            onClick={() => setActiveTab('points')}
            className={`flex-1 py-2.5 rounded-full text-sm font-extrabold transition-all ${
              activeTab === 'points'
                ? 'bg-gradient-to-r from-[#ff1e7a] to-[#e91e63] text-white shadow-[0_0_20px_rgba(255,30,122,0.5)]'
                : 'text-white/70 hover:text-white'
            }`}
          >
            {isRtl ? 'پوائنٹس (Points)' : 'Points'}
          </button>
        </div>

        {/* 4. MAIN DUAL BALANCE CARD (Coins 12,500 + Top-up | Points 8,420 + Earnings Points) */}
        <div className="rounded-3xl bg-gradient-to-b from-[#1a0d36] to-[#130829] border border-purple-500/25 p-5 mb-4 shadow-[0_8px_32px_rgba(88,28,135,0.25)]">
          {/* A. Viewer Coins Row */}
          <div
            className={`flex items-center justify-between transition-opacity ${
              activeTab === 'points' ? 'opacity-85' : 'opacity-100'
            }`}
          >
            <div className="flex items-center gap-3.5">
              {/* Custom Golden Coin Icon */}
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-yellow-600 p-0.5 shadow-[0_0_16px_rgba(245,158,11,0.45)] flex-shrink-0">
                <div className="w-full h-full rounded-full border-2 border-amber-200/70 flex items-center justify-center bg-gradient-to-tr from-amber-500 to-yellow-300">
                  <Coins className="w-5 h-5 text-amber-950 stroke-[2.5]" />
                </div>
              </div>
              <div>
                <div
                  data-testid="wallet-coins-balance"
                  className="text-3xl font-black tracking-tight text-white tabular-nums"
                >
                  {isLoading ? '...' : displayCoins.toLocaleString()}
                </div>
                {activeTab === 'coins' && (
                  <p className="text-[11px] text-amber-300/80 font-semibold mt-0.5">
                    {isRtl ? 'تحائف بھیجنے کے لیے سکے' : 'Available Coins (For Gifting)'}
                  </p>
                )}
              </div>
            </div>

            <Link
              href="/recharge"
              data-testid="wallet-topup-btn"
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#ff1e7a] to-[#ec4899] hover:brightness-110 text-white font-extrabold text-sm shadow-[0_0_20px_rgba(255,30,122,0.5)] active:scale-95 transition-all"
            >
              {isRtl ? 'ٹاپ اپ' : 'Top-up'}
            </Link>
          </div>

          <div className="h-[1px] bg-purple-400/15 my-4" />

          {/* B. Host Earnings Points Row */}
          <div
            className={`flex items-center justify-between transition-opacity ${
              activeTab === 'coins' ? 'opacity-95' : 'opacity-100'
            }`}
          >
            <div>
              <div className="flex items-center gap-3.5">
                {/* Golden/Pink Star Icon */}
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-300/20 to-pink-500/20 border border-amber-400/30 flex items-center justify-center shadow-[0_0_16px_rgba(251,191,36,0.25)] flex-shrink-0">
                  <svg className="w-7 h-7 drop-shadow-[0_2px_6px_rgba(251,191,36,0.6)]" viewBox="0 0 24 24" fill="url(#starGrad)">
                    <defs>
                      <linearGradient id="starGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#FDE047" />
                        <stop offset="60%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#EC4899" />
                      </linearGradient>
                    </defs>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <div
                  data-testid="wallet-points-balance"
                  className="text-3xl font-black tracking-tight text-white tabular-nums"
                >
                  {isLoading ? '...' : displayPoints.toLocaleString()}
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm font-semibold text-white/75">
                  {isRtl ? 'کمائی کے پوائنٹس' : 'Earnings Points'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-200 border border-purple-400/30">
                  {isRtl ? '70% ہوسٹ شیئر' : '70% Gift Share'}
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[11px] font-semibold text-white/70">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isRtl ? 'الگ بیلنس' : 'Separate Balance'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. HISTORY NAVIGATION CARD (Coin History > | Points History >) */}
        <div className="rounded-3xl bg-gradient-to-b from-[#1a0d36] to-[#130829] border border-purple-500/25 overflow-hidden mb-5 shadow-lg">
          <Link
            href={`/wallet/coin-history${historyQueryParams}`}
            data-testid="link-coin-history"
            className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.04] transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#d946ef] to-[#ff2d78] flex items-center justify-center shadow-[0_0_12px_rgba(217,70,239,0.4)]">
                <Hourglass className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  {isRtl ? 'سکوں کی ہسٹری' : 'Coin History'}
                </div>
                <div className="text-[11px] text-white/50">
                  {isRtl ? 'ٹاپ اپ، تحائف اور ایڈجسٹمنٹس' : 'Top-ups, sent gifts & ledger status'}
                </div>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 text-white/50 ${isRtl ? 'rotate-180' : ''}`} />
          </Link>

          <div className="h-[1px] bg-purple-400/15 mx-5" />

          <Link
            href={`/wallet/points-history${historyQueryParams}`}
            data-testid="link-points-history"
            className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.04] transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#8b5cf6] to-[#d946ef] flex items-center justify-center shadow-[0_0_12px_rgba(139,92,246,0.4)]">
                <Hourglass className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  {isRtl ? 'پوائنٹس کی ہسٹری' : 'Points History'}
                </div>
                <div className="text-[11px] text-white/50">
                  {isRtl ? 'موصول شدہ تحائف سے 70% کمائی' : 'Host points earned from eligible gifts'}
                </div>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 text-white/50 ${isRtl ? 'rotate-180' : ''}`} />
          </Link>

          <div className="h-[1px] bg-purple-400/15 mx-5" />

          <Link
            href={isPreviewDemo ? '/earnings?preview=demo' : '/earnings'}
            data-testid="link-host-earnings"
            className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.04] transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ff007f] to-[#f59e0b] flex items-center justify-center shadow-[0_0_12px_rgba(255,0,127,0.4)]">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  {isRtl ? 'ہوسٹ کمائی ڈیش بورڈ (70%)' : 'Host Earnings & 70% Share'}
                </div>
                <div className="text-[11px] text-white/50">
                  {isRtl ? 'روزانہ، ہفتہ وار، ماہانہ اعداد و شمار اور چارٹس' : 'Daily/weekly/monthly charts & 70/30 split'}
                </div>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 text-white/50 ${isRtl ? 'rotate-180' : ''}`} />
          </Link>

          <Link
            href={isPreviewDemo ? '/vip?preview=demo' : '/vip'}
            data-testid="link-vip-membership"
            className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.04] transition-colors border-t border-white/5"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-[0_0_12px_rgba(251,191,36,0.4)]">
                <Crown className="w-4 h-4 text-[#1D0F03]" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  {isRtl ? 'وی آئی پی رکنیت اور مراعات (7.7)' : 'VIP Membership & Benefits'}
                </div>
                <div className="text-[11px] text-white/50">
                  {isRtl ? 'وی آئی پی بیج، پروفائل فریم اور شاہی آمد' : 'VIP Crown Badge, Frame, Entrances & History'}
                </div>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 text-white/50 ${isRtl ? 'rotate-180' : ''}`} />
          </Link>

          <Link
            href={isPreviewDemo ? '/recognition?preview=demo' : '/recognition'}
            data-testid="link-recognition-center"
            className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.04] transition-colors border-t border-white/5"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF2E74] to-[#A855F7] flex items-center justify-center shadow-[0_0_12px_rgba(255,46,116,0.4)]">
                <Award className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  {isRtl ? 'دولت، شائننگ اور اعزاز (7.8)' : 'Wealth, Shining & Honor'}
                </div>
                <div className="text-[11px] text-white/50">
                  {isRtl ? 'تین الگ الگ درجات، ترقی، مراعات اور لیڈر بورڈ' : 'Separate Levels, Wings, Benefits & Leaderboards'}
                </div>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 text-white/50 ${isRtl ? 'rotate-180' : ''}`} />
          </Link>

          <Link
            href={isPreviewDemo ? '/store?preview=demo' : '/store'}
            data-testid="link-virtual-store"
            className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.04] transition-colors border-t border-white/5"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ff2e74] to-amber-400 flex items-center justify-center shadow-[0_0_12px_rgba(255,46,116,0.4)]">
                <ShoppingBag className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  {isRtl ? 'ورچوئل اسٹور اور انوینٹری (7.9)' : 'Virtual Store & Inventory'}
                </div>
                <div className="text-[11px] text-white/50">
                  {isRtl ? 'فریمز، چیٹ ببلز، انٹری ایفیکٹس اور تھیمز' : 'Avatar Frames, Chat Bubbles, Entrances & Themes'}
                </div>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 text-white/50 ${isRtl ? 'rotate-180' : ''}`} />
          </Link>
        </div>

        {/* 6. RECENT TRANSACTIONS LIST (Switchable between Coins & Points based on activeTab) */}
        <div className="rounded-3xl bg-[#150a2c]/90 border border-purple-500/20 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-purple-200/80">
              {activeTab === 'coins'
                ? isRtl
                  ? 'حالیہ سکوں کا لین دین'
                  : 'Recent Coin Transactions'
                : isRtl
                ? 'حالیہ پوائنٹس کی کمائی'
                : 'Recent Points Earnings'}
            </h2>
            <Link
              href={
                activeTab === 'coins'
                  ? `/wallet/coin-history${historyQueryParams}`
                  : `/wallet/points-history${historyQueryParams}`
              }
              className="text-[11px] font-bold text-[#ff2d78] hover:underline"
            >
              {isRtl ? 'سب دیکھیں' : 'View All'}
            </Link>
          </div>

          {activeTab === 'coins' ? (
            recentCoinTxs.length === 0 ? (
              <p className="text-xs text-white/40 py-4 text-center">
                {isRtl ? 'ابھی تک کوئی لین دین نہیں' : 'No recent coin transactions yet.'}
              </p>
            ) : (
              <div className="space-y-2.5">
                {recentCoinTxs.slice(0, 3).map((tx) => (
                  <div
                    key={tx.transactionId}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.03] border border-white/5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          tx.direction === 'credit'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-pink-500/15 text-pink-400'
                        }`}
                      >
                        {tx.direction === 'credit' ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {tx.description || tx.transactionType}
                        </div>
                        <div className="text-[10px] text-white/40 font-mono truncate">
                          {tx.transactionId}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 ms-2">
                      <div
                        className={`text-xs font-black tabular-nums ${
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
                      <div className="mt-0.5">{renderStatusBadge(tx.status)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : recentPointsTxs.length === 0 ? (
            <p className="text-xs text-white/40 py-4 text-center">
              {isRtl ? 'ابھی تک کوئی پوائنٹس نہیں' : 'No recent points earnings yet.'}
            </p>
          ) : (
            <div className="space-y-2.5">
              {recentPointsTxs.slice(0, 3).map((tx) => (
                <div
                  key={tx.transactionId}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.03] border border-white/5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center flex-shrink-0">
                      <ArrowDownLeft className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {tx.giftSource}
                      </div>
                      <div className="text-[10px] text-white/45 truncate">
                        {tx.senderName ? `From: ${tx.senderName} • ` : ''}
                        {tx.sharePercentageApplied}% Share
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 ms-2">
                    <div className="text-xs font-black text-amber-400 tabular-nums">
                      {tx.direction === 'credit' ? '+' : '-'}
                      {tx.pointsAmount.toLocaleString()} pts
                    </div>
                    <div className="mt-0.5">{renderStatusBadge(tx.status)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Clear Balance Info Notice */}
          <div className="mt-3 pt-2.5 border-t border-white/5 flex items-start gap-2 text-[10px] text-white/45 leading-relaxed">
            <Info className="w-3.5 h-3.5 text-purple-300 flex-shrink-0 mt-0.5" />
            <span>
              {isRtl
                ? 'سکے اور پوائنٹس دو الگ بیلنس ہیں۔ میزبانوں کو اہل تحائف کے 70% سکے بطور پوائنٹس ملتے ہیں۔'
                : 'Coins and Points are strictly separate balances. Hosts earn 70% of eligible gift coins as Earnings Points. Withdrawal rules belong to Creator Business modules.'}
            </span>
          </div>
        </div>
      </div>

      {/* 7. BOTTOM WATERMARK: P7.1 Coins and Points (Exact match to 07_01_coins_and_points.png) */}
      <footer className="relative z-10 pb-5 pt-2 px-4 flex flex-col items-center justify-center bg-gradient-to-t from-[#090216] via-[#090216]/90 to-transparent">
        <div className="px-7 py-1.5 rounded-full bg-gradient-to-r from-[#ff1e7a] to-[#ec4899] text-white font-black text-base tracking-wide shadow-[0_0_24px_rgba(255,30,122,0.5)]">
          P7.1
        </div>
        <div
          data-testid="watermark-p71"
          className="mt-1.5 text-lg font-extrabold text-white tracking-tight text-center"
        >
          {isRtl ? 'سکے اور پوائنٹس (Coins and Points)' : 'Coins and Points'}
        </div>
      </footer>
    </div>
  );
}
