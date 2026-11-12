'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowLeft,
  BarChart3,
  Bell,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Coins,
  Gift,
  Globe,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Wifi,
  WifiOff,
} from 'lucide-react';
import type {
  HostEarningShareRecord,
  HostEarningsDashboardSummary,
} from '@/lib/hostEarnings';

interface HostEarningsDashboardProps {
  initialHostUserId?: string;
  isPreviewDemo?: boolean;
}

const DEFAULT_FALLBACK_BREAKDOWN = {
  giftId: 'gift_rose',
  giftName: 'Rose',
  giftQuantity: 10,
  originalCoinAmount: 100,
  hostSharePercentage: 70,
  pointsCredited: 70,
  platformSharePercentage: 30,
  platformShareAmount: 30,
};

function resolveGiftImg(giftId: string): string {
  const known: Record<string, string> = {
    gift_rose: '/assets/gifts/rose.png',
    gift_heart: '/assets/gifts/heart.png',
    gift_teddy: '/assets/gifts/teddy.png',
    gift_crown: '/assets/gifts/crown.png',
    gift_sports_car: '/assets/gifts/sports_car.png',
    gift_castle: '/assets/gifts/castle.png',
    gift_diamond_ring: '/assets/gifts/diamond_ring.png',
    gift_royal_yacht: '/assets/gifts/royal_yacht.png',
    gift_galaxy_jet: '/assets/gifts/galaxy_jet.png',
    gift_dragon_phoenix: '/assets/gifts/dragon_phoenix.png',
  };
  return known[giftId] || '/assets/gifts/rose.png';
}

export default function HostEarningsDashboard({
  initialHostUserId,
  isPreviewDemo = false,
}: HostEarningsDashboardProps) {
  const [lang, setLang] = useState<'en' | 'ur'>('en');
  const isUrdu = lang === 'ur';

  const [hostUserId, setHostUserId] = useState<string>(
    initialHostUserId || '00000000-0000-0000-0000-000000088201'
  );
  const [dashboard, setDashboard] = useState<HostEarningsDashboardSummary | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<HostEarningShareRecord | null>(null);
  const [historyItems, setHistoryItems] = useState<HostEarningShareRecord[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sseConnected, setSseConnected] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const esRef = useRef<EventSource | null>(null);
  const querySuffix = isPreviewDemo ? '&preview=demo' : '';

  const showToast = useCallback((text: string) => {
    setToastMsg(text);
    setTimeout(() => setToastMsg((prev) => (prev === text ? null : prev)), 4000);
  }, []);

  const loadDashboard = useCallback(
    async (fresh: boolean = false) => {
      try {
        const res = await fetch(
          `/api/earnings/dashboard?hostUserId=${encodeURIComponent(hostUserId)}${
            fresh ? '&fresh=true' : ''
          }${querySuffix}`,
          { cache: 'no-store' }
        );
        const data = await res.json();
        if (!res.ok || !data.success) {
          setErrorMsg(data.error || 'Failed to load host earnings.');
          return;
        }
        setDashboard(data.dashboard);
        setSelectedRecord((prev) => prev || data.dashboard?.latestBreakdown || null);
        setErrorMsg(null);
      } catch {
        setErrorMsg('Network error loading host earnings dashboard.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [hostUserId, querySuffix]
  );

  const loadHistory = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        hostUserId,
        page: String(page),
        limit: '8',
      });
      if (isPreviewDemo) params.set('preview', 'demo');
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (sourceFilter !== 'all') params.set('sourceType', sourceFilter);
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/earnings/history?${params.toString()}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.success) {
        setHistoryItems(data.items || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      }
    } catch {}
  }, [hostUserId, page, isPreviewDemo, statusFilter, sourceFilter, fromDate, toDate, searchQuery]);

  useEffect(() => {
    setLoading(true);
    setSelectedRecord(null);
    loadDashboard(true);
  }, [hostUserId, loadDashboard]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Real-time SSE listener strictly scoped to current authorized host
  useEffect(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const sseUrl = `/api/earnings/events?hostUserId=${encodeURIComponent(hostUserId)}${querySuffix}`;
    const es = new EventSource(sseUrl);
    esRef.current = es;

    es.onopen = () => setSseConnected(true);
    es.onerror = () => setSseConnected(false);

    es.addEventListener('earnings:state_sync', (ev: MessageEvent) => {
      try {
        const parsed = JSON.parse(ev.data);
        if (parsed.dashboard) {
          setDashboard(parsed.dashboard);
        }
        setSseConnected(true);
      } catch {}
    });

    es.addEventListener('earnings:points_credited', (ev: MessageEvent) => {
      try {
        const parsed = JSON.parse(ev.data);
        showToast(
          `+${Number(parsed.pointsCredited || 0).toLocaleString()} Points (${parsed.hostSharePercentage || 70}% Share)`
        );
        loadDashboard(true);
        loadHistory();
      } catch {}
    });

    es.addEventListener('earnings:transaction_reversed', () => {
      showToast(isUrdu ? 'تحفے کی واپسی ریکارڈ ہوگئی' : 'Gift reversal updated host points cleanly');
      loadDashboard(true);
      loadHistory();
    });

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [hostUserId, querySuffix, loadDashboard, loadHistory, showToast, isUrdu]);

  const activeShowcase = useMemo(() => {
    if (selectedRecord) return selectedRecord;
    if (dashboard?.latestBreakdown) return dashboard.latestBreakdown;
    return DEFAULT_FALLBACK_BREAKDOWN;
  }, [selectedRecord, dashboard]);

  const maxDailyPoints = useMemo(() => {
    const vals = (dashboard?.dailySeries || []).map((d) => d.pointsEarned);
    return Math.max(100, ...vals);
  }, [dashboard]);

  const sharePct = dashboard?.hostSharePercentage ?? 70;
  const platformPct = dashboard?.platformSharePercentage ?? 30;

  return (
    <div
      dir={isUrdu ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#0c031c] text-white pb-14"
      data-testid="host-earnings-screen"
    >
      <div className="max-w-5xl mx-auto px-3 sm:px-6 pt-4">
        {/* Top Bar matching 07_05_host_share_into_points.png */}
        <header className="rounded-2xl bg-[#160731]/90 border border-purple-500/25 px-4 py-3 flex items-center justify-between gap-2 mb-5 shadow-[0_0_24px_rgba(168,85,247,0.16)]">
          <div className="flex items-center gap-2.5">
            <Link
              href={isPreviewDemo ? '/wallet?preview=demo' : '/wallet'}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 transition"
              title="Back to Wallet"
            >
              <ArrowLeft className={`w-4 h-4 ${isUrdu ? 'rotate-180' : ''}`} />
            </Link>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#ff007f] to-[#a855f7] flex items-center justify-center font-black text-sm shadow-[0_0_16px_rgba(255,0,127,0.5)]">
              P
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-white text-base">
                {isUrdu ? 'پوپو لائیو' : 'Popo Live'}
              </span>
              <span
                className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  sseConnected
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
                    : 'bg-purple-500/15 text-purple-300 border-purple-400/30'
                }`}
              >
                {sseConnected ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
                <span>{sseConnected ? (isUrdu ? 'لائیو' : 'Live') : 'Sync'}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/earning-identity"
              data-testid="earnings-identity-link"
              className="h-8 px-3 rounded-full bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/35 hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-200 transition whitespace-nowrap"
              title="Earning Identity & Verification"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>{isUrdu ? 'شناخت' : 'Earning Identity'}</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                setRefreshing(true);
                loadDashboard(true);
                loadHistory();
              }}
              data-testid="earnings-refresh-btn"
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 transition"
              title="Refresh Earnings"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#ff2d78]' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setLang(isUrdu ? 'en' : 'ur')}
              data-testid="earnings-lang-toggle"
              className="h-8 px-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-1 text-[11px] font-bold text-[#ff2d78] transition"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'EN' : 'UR'}</span>
            </button>
            <Link
              href="/admin/finance"
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 transition"
              title="Finance Admin Controls"
            >
              <Bell className="w-4 h-4" />
            </Link>
            <Link
              href={isPreviewDemo ? '/wallet?preview=demo' : '/wallet'}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 transition"
              title="Wallet Settings"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </header>

        {toastMsg && (
          <div className="mb-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 px-4 py-2.5 text-xs font-bold text-emerald-200 flex items-center gap-2 shadow-lg">
            <Sparkles className="w-4 h-4 text-emerald-300 flex-shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 rounded-2xl bg-rose-500/15 border border-rose-400/40 px-4 py-3 text-xs font-semibold text-rose-200">
            {errorMsg}
          </div>
        )}

        {/* Section 1: 1:1 Hero Design Reference Card (07_05_host_share_into_points.png) */}
        <section className="max-w-md mx-auto mb-7">
          <div className="flex items-center justify-between mb-3 px-1">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                {isUrdu ? 'ہوسٹ پوائنٹس شیئر' : 'Host Points Share'}
              </h1>
              <p className="text-xs text-purple-200/75 mt-0.5">
                {dashboard?.hostNickname || 'Sara Live'} •{' '}
                {isUrdu
                  ? `منظور شدہ ${sharePct}% ہوسٹ / ${platformPct}% پلیٹ فارم شیئر`
                  : `Approved ${sharePct}% Host / ${platformPct}% Platform Split`}
              </p>
            </div>
            {isPreviewDemo && (
              <select
                value={hostUserId}
                onChange={(e) => {
                  setHostUserId(e.target.value);
                  setPage(1);
                }}
                data-testid="preview-host-select"
                className="rounded-xl bg-[#1a0b38] border border-purple-400/35 px-2.5 py-1.5 text-xs font-semibold text-white"
              >
                <option value="00000000-0000-0000-0000-000000088201">Sara Live</option>
                <option value="00000000-0000-0000-0000-000000088202">Ayesha</option>
              </select>
            )}
          </div>

          {/* Rounded Glowing Gift -> Arrow -> Host Points Share Flow Card */}
          <div
            data-testid="hero-share-flow-card"
            className="rounded-[28px] bg-gradient-to-b from-[#1f0d45] via-[#19093a] to-[#13062d] border border-purple-400/40 p-5 shadow-[0_0_40px_rgba(168,85,247,0.22)] text-center relative overflow-hidden"
          >
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-purple-500/20 border border-purple-300/30 text-[11px] font-bold text-purple-100 mb-3">
              <Gift className="w-3.5 h-3.5 text-[#ff2d78]" />
              <span>{isUrdu ? 'تحفہ موصول ہوا' : 'Gift Received'}</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-[#271055] border border-pink-400/35 p-2 flex items-center justify-center shadow-[0_0_24px_rgba(255,45,120,0.28)] mb-2">
                <img
                  src={resolveGiftImg(activeShowcase.giftId)}
                  alt={activeShowcase.giftName}
                  onError={(e) => {
                    e.currentTarget.src = '/assets/gifts/fallback_gift.png';
                  }}
                  className="w-12 h-12 object-contain"
                />
              </div>
              <div className="text-lg font-extrabold text-white" data-testid="showcase-gift-title">
                {activeShowcase.giftName} x{activeShowcase.giftQuantity}
              </div>
              <div className="mt-1 inline-flex items-center gap-1.5 text-sm font-black text-amber-300">
                <Coins className="w-4 h-4 text-amber-400" />
                <span data-testid="showcase-coins">
                  {activeShowcase.originalCoinAmount.toLocaleString()} {isUrdu ? 'سکے' : 'Coins'}
                </span>
              </div>
            </div>

            {/* Neon Pink Conversion Arrow */}
            <div className="my-3 flex flex-col items-center">
              <div className="w-9 h-9 rounded-full bg-gradient-to-b from-[#ff007f] to-[#a855f7] flex items-center justify-center shadow-[0_0_18px_rgba(255,0,127,0.6)]">
                <ArrowDown className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="text-xs font-bold uppercase tracking-wider text-purple-200/80 mb-1">
              {isUrdu
                ? `ہوسٹ شیئر (${activeShowcase.hostSharePercentage}%)`
                : `Host Share (${activeShowcase.hostSharePercentage}%)`}
            </div>
            <div className="inline-flex items-center gap-2 text-2xl font-black text-white">
              <Star className="w-6 h-6 text-amber-300 fill-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.75)]" />
              <span data-testid="showcase-points">
                {activeShowcase.pointsCredited.toLocaleString()} {isUrdu ? 'پوائنٹس' : 'Points'}
              </span>
            </div>
          </div>

          {/* Transparent Breakdown Card directly below Hero Card */}
          <div
            data-testid="hero-split-breakdown-card"
            className="mt-3 rounded-2xl bg-[#160833] border border-purple-500/30 px-5 py-3.5 space-y-2 text-xs shadow-lg"
          >
            <div className="flex items-center justify-between text-purple-100/90">
              <span>{isUrdu ? 'کل سکے' : 'Total Coins'}:</span>
              <span className="font-extrabold text-amber-300 tabular-nums">
                {activeShowcase.originalCoinAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-purple-100/90">
              <span>
                {isUrdu
                  ? `ہوسٹ شیئر (${activeShowcase.hostSharePercentage}%)`
                  : `Host Share (${activeShowcase.hostSharePercentage}%)`}
                :
              </span>
              <span className="font-extrabold text-emerald-300 tabular-nums">
                {activeShowcase.pointsCredited.toLocaleString()} {isUrdu ? 'پوائنٹس' : 'Points'}
              </span>
            </div>
            <div className="h-[1px] bg-purple-400/15" />
            <div className="flex items-center justify-between text-purple-200/75">
              <span>
                {isUrdu
                  ? `پلیٹ فارم شیئر (${activeShowcase.platformSharePercentage}%)`
                  : `Platform Share (${activeShowcase.platformSharePercentage}%)`}
                :
              </span>
              <span className="font-bold text-pink-300 tabular-nums">
                {activeShowcase.platformShareAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* P7.5 Footer Badge Watermark matching Design Ref */}
          <div className="mt-4 flex flex-col items-center gap-1.5 text-center">
            <span className="px-4 py-1 rounded-full bg-gradient-to-r from-[#ff007f] to-[#ec4899] text-xs font-black tracking-wider text-white shadow-[0_0_18px_rgba(255,0,127,0.55)]">
              P7.5
            </span>
            <p className="text-sm font-extrabold text-white">
              {isUrdu ? 'تحائف سے پوائنٹس کا حصہ' : 'Host Share into Points'}
            </p>
          </div>
        </section>

        {/* Non-Cash Separation Notice */}
        <div className="rounded-2xl bg-[#140a30] border border-emerald-500/30 px-4 py-3 mb-6 flex items-start gap-2.5 text-xs text-emerald-200/90">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white">
              {isUrdu ? 'الگ مالیاتی نظام: ' : 'Separate Coins & Points Ledger: '}
            </span>
            {isUrdu
              ? 'ہوسٹ کو ہر اہل تحفے کے سکوں کا 70 فیصد پوائنٹس میں ملتا ہے اور 30 فیصد پلیٹ فارم شیئر ریکارڈ ہوتا ہے۔ پوائنٹس نقد رقم نہیں ہیں۔'
              : dashboard?.disclaimer ||
                '70% of eligible gift coins credit as Host Points; 30% records as Platform Share. Points and Coins remain strictly separate and Points never represent cash.'}
          </div>
        </div>

        {/* Section 2: Host Earnings KPI Statistics Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6" data-testid="earnings-kpi-grid">
          <div className="rounded-2xl bg-[#190a39] border border-amber-400/30 p-3.5 col-span-2 lg:col-span-2">
            <div className="text-[11px] font-bold text-purple-200/75 uppercase">
              {isUrdu ? 'موجودہ پوائنٹس بیلنس' : 'Current Points Balance'}
            </div>
            <div
              data-testid="kpi-current-points"
              className="mt-1 text-2xl font-black text-amber-300 tabular-nums flex items-center gap-1.5"
            >
              <Star className="w-5 h-5 fill-amber-300 text-amber-300" />
              <span>{loading ? '...' : (dashboard?.currentPointsBalance ?? 0).toLocaleString()}</span>
            </div>
            <div className="mt-1 text-[11px] text-purple-200/65">
              {isUrdu ? 'کل کمائے گئے پوائنٹس: ' : 'Total Received Gifts Points: '}
              {(dashboard?.totalEarnedPointsFromGifts ?? 0).toLocaleString()}
            </div>
          </div>

          <div className="rounded-2xl bg-[#190a39] border border-purple-500/25 p-3.5">
            <div className="text-[11px] font-bold text-purple-200/75 uppercase">
              {isUrdu ? 'آج کی کمائی' : "Today's Points"}
            </div>
            <div data-testid="kpi-today-points" className="mt-1 text-xl font-black text-white tabular-nums">
              {loading ? '...' : (dashboard?.todayEarnedPoints ?? 0).toLocaleString()}
            </div>
            <div className="mt-1 text-[10px] text-emerald-300 font-semibold">UTC Today</div>
          </div>

          <div className="rounded-2xl bg-[#190a39] border border-purple-500/25 p-3.5">
            <div className="text-[11px] font-bold text-purple-200/75 uppercase">
              {isUrdu ? 'ہفتہ وار' : 'Weekly Points'}
            </div>
            <div data-testid="kpi-weekly-points" className="mt-1 text-xl font-black text-white tabular-nums">
              {loading ? '...' : (dashboard?.weeklyEarnedPoints ?? 0).toLocaleString()}
            </div>
            <div className="mt-1 text-[10px] text-purple-200/70">Last 7 Days</div>
          </div>

          <div className="rounded-2xl bg-[#190a39] border border-purple-500/25 p-3.5">
            <div className="text-[11px] font-bold text-purple-200/75 uppercase">
              {isUrdu ? 'ماہانہ پوائنٹس' : 'Monthly Points'}
            </div>
            <div data-testid="kpi-monthly-points" className="mt-1 text-xl font-black text-white tabular-nums">
              {loading ? '...' : (dashboard?.monthlyEarnedPoints ?? 0).toLocaleString()}
            </div>
            <div className="mt-1 text-[10px] text-purple-200/70">Last 30 Days</div>
          </div>

          <div className="rounded-2xl bg-[#190a39] border border-pink-500/30 p-3.5">
            <div className="text-[11px] font-bold text-purple-200/75 uppercase">
              {isUrdu ? 'موصولہ تحائف' : 'Gifts Received'}
            </div>
            <div data-testid="kpi-gifts-count" className="mt-1 text-xl font-black text-pink-300 tabular-nums">
              {loading ? '...' : (dashboard?.totalReceivedGiftsCount ?? 0).toLocaleString()}
            </div>
            <div className="mt-1 text-[10px] text-amber-300 font-bold">
              {sharePct}% Host Share
            </div>
          </div>
        </section>

        {/* Section 3: Charts (7-Day Daily Points Bar Chart + Gift Category Breakdown) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl bg-[#170933] border border-purple-500/25 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#ff2d78]" />
                <span>{isUrdu ? '7 دن کی پوائنٹس کمائی' : '7-Day Points Earning Statistics'}</span>
              </h2>
              <span className="text-[11px] text-purple-200/70">
                {sharePct}% Share / {platformPct}% Platform
              </span>
            </div>
            <div className="h-44 flex items-end justify-between gap-2 pt-4 pb-1 px-1" data-testid="daily-earnings-chart">
              {(dashboard?.dailySeries || []).map((day) => {
                const heightPct = Math.max(8, Math.round((day.pointsEarned / maxDailyPoints) * 100));
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] font-bold text-amber-300 tabular-nums">
                      {day.pointsEarned > 0 ? day.pointsEarned : '0'}
                    </span>
                    <div className="w-full max-w-[34px] h-28 flex items-end rounded-lg bg-white/5 overflow-hidden p-0.5">
                      <div
                        style={{ height: `${day.pointsEarned > 0 ? heightPct : 4}%` }}
                        className="w-full rounded-md bg-gradient-to-t from-[#ff007f] via-[#d946ef] to-amber-300 transition-all duration-300"
                        title={`${day.label}: ${day.pointsEarned} pts (${day.coinsReceived} coins)`}
                      />
                    </div>
                    <span className="text-[10px] text-purple-200/75 whitespace-nowrap">{day.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-[#170933] border border-purple-500/25 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-300" />
                <span>{isUrdu ? 'سرِفہرست تحائف کا حصہ' : 'Top Gift Share Contribution'}</span>
              </h2>
              <span className="text-[11px] text-purple-200/70">
                Coins → Points ({sharePct}%)
              </span>
            </div>
            {dashboard?.topGiftsSeries?.length ? (
              <div className="space-y-2.5">
                {dashboard.topGiftsSeries.map((g) => (
                  <div key={g.giftId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">
                        {g.giftName}{' '}
                        <span className="text-purple-300/75 font-normal">({g.giftsCount}x)</span>
                      </span>
                      <span className="font-bold text-amber-300 tabular-nums">
                        +{g.pointsEarned.toLocaleString()} pts{' '}
                        <span className="text-[10px] text-purple-200/65">
                          ({g.totalCoins.toLocaleString()} coins)
                        </span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        style={{ width: `${Math.max(4, g.shareOfEarnedPercent)}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-[#ff007f] to-amber-300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-36 flex items-center justify-center text-xs text-purple-200/60">
                {isUrdu ? 'ابھی تک کوئی تحفہ موصول نہیں ہوا۔' : 'No gift earnings recorded yet for this host.'}
              </div>
            )}
          </div>
        </section>

        {/* Section 4: Date-Filtered & Paginated Points Transaction History */}
        <section className="rounded-2xl bg-[#170933] border border-purple-500/25 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-base font-black text-white">
              {isUrdu ? 'حالیہ تحائف اور پوائنٹس ہسٹری' : 'Recent Gift Earnings & Points History'}
            </h2>
            <span className="text-xs text-purple-200/75">
              {totalCount} {isUrdu ? 'ریکارڈز' : 'records'} •{' '}
              {isUrdu ? 'شیئر تفصیل کے لیے کلک کریں' : 'Click any row to inspect split above'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 mb-4">
            <div className="relative lg:col-span-2">
              <Search className="w-3.5 h-3.5 text-purple-300/60 absolute top-1/2 -translate-y-1/2 left-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder={isUrdu ? 'تحفہ، بھیجنے والا یا آئی ڈی...' : 'Search gift, sender or ID...'}
                className="w-full rounded-xl bg-[#0e0524] border border-purple-400/25 pl-8 pr-3 py-2 text-xs text-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl bg-[#0e0524] border border-purple-400/25 px-3 py-2 text-xs text-white"
            >
              <option value="all">{isUrdu ? 'تمام اسٹیٹس' : 'All Statuses'}</option>
              <option value="credited">{isUrdu ? 'کریڈٹ شدہ' : 'Credited'}</option>
              <option value="reversed">{isUrdu ? 'واپس شدہ' : 'Reversed'}</option>
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl bg-[#0e0524] border border-purple-400/25 px-3 py-2 text-xs text-white"
            >
              <option value="all">{isUrdu ? 'تمام ذرائع' : 'All Sources'}</option>
              <option value="live_room">{isUrdu ? 'لائیو روم' : 'Live Room'}</option>
              <option value="pk_battle">{isUrdu ? 'PK مقابلہ' : 'PK Battle'}</option>
            </select>

            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-300/60 flex-shrink-0" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                aria-label="From Date"
                className="w-full rounded-xl bg-[#0e0524] border border-purple-400/25 px-2 py-2 text-[11px] text-white"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                aria-label="To Date"
                className="w-full rounded-xl bg-[#0e0524] border border-purple-400/25 px-2 py-2 text-[11px] text-white"
              />
            </div>
          </div>

          <div className="space-y-2.5" data-testid="earnings-history-list">
            {historyItems.length === 0 ? (
              <div className="py-10 text-center text-xs text-purple-200/60">
                {isUrdu
                  ? 'موجودہ فلٹرز کے مطابق کوئی کمائی نہیں ملی۔'
                  : 'No matching gift earnings found for selected filters.'}
              </div>
            ) : (
              historyItems.map((item) => {
                const isSelected = selectedRecord?.earningId === item.earningId;
                return (
                  <button
                    type="button"
                    key={item.earningId}
                    onClick={() => setSelectedRecord(item)}
                    className={`w-full text-left rounded-2xl border p-3.5 flex flex-wrap items-center justify-between gap-3 transition ${
                      isSelected
                        ? 'bg-[#281058] border-[#ff007f]'
                        : 'bg-[#12062a] border-purple-400/20 hover:border-purple-400/45'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={resolveGiftImg(item.giftId)}
                        alt={item.giftName}
                        onError={(e) => {
                          e.currentTarget.src = '/assets/gifts/fallback_gift.png';
                        }}
                        className="w-10 h-10 object-contain flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-white flex items-center gap-2 flex-wrap">
                          <span>
                            {item.giftName} x{item.giftQuantity}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/25 text-purple-200">
                            {item.sourceType === 'pk_battle' ? 'PK Battle' : 'Live Room'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'credited'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {item.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-[11px] text-purple-200/75 mt-0.5">
                          From <strong className="text-white">{item.senderNickname}</strong> •{' '}
                          <span className="font-mono">{item.giftTransactionId}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-sm font-black tabular-nums ${
                          item.status === 'credited' ? 'text-amber-300' : 'text-rose-300 line-through'
                        }`}
                      >
                        +{item.pointsCredited.toLocaleString()} pts ({item.hostSharePercentage}%)
                      </div>
                      <div className="text-[11px] text-purple-200/70 tabular-nums">
                        {item.originalCoinAmount.toLocaleString()} coins • Platform{' '}
                        {item.platformShareAmount.toLocaleString()} ({item.platformSharePercentage}%)
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between text-xs text-purple-200/80">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 disabled:opacity-40 flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 disabled:opacity-40 flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
