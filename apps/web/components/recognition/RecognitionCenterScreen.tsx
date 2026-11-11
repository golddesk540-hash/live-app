'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Award,
  Bell,
  Check,
  ChevronRight,
  Crown,
  Flame,
  Globe,
  History,
  Lock,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useLanguage } from '@/lib/languageContext';
import type {
  CategoryProgressSummary,
  HonorRecognitionFactor,
  RecognitionCategory,
  RecognitionLevelUpEventRecord,
  UserRecognitionSummary,
} from '@/lib/recognition';
import {
  LevelWingBadge,
  RecognitionCategoryIcon,
  RecognitionLevelUpOverlay,
} from '@/components/recognition/LevelWingBadge';

interface LeaderboardRow {
  rank: number;
  userId: string;
  poppoId: string;
  nickname: string;
  avatarUrl: string;
  category: RecognitionCategory;
  score: number;
  levelNumber: number;
  levelName: string;
  levelNameUr: string;
  badgeImageUrl: string;
  wingStyle: string;
  borderColor: string;
}

const SHOWCASE_AVATARS = [
  '/assets/following/zara_live.png',
  '/assets/chat/avatar_ayesha.png',
  '/assets/following/alina.png',
];

function SafeAvatar({ src, name }: { src?: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  const valid = src && src !== '/avatars/default.png' && !failed;
  const initials = (name || 'PL').trim().slice(0, 2).toUpperCase();
  if (!valid) {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF2E74] to-[#7C3AED] border border-purple-300/40 shrink-0 flex items-center justify-center text-[11px] font-black text-white">
        {initials}
      </div>
    );
  }
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={name}
      onError={() => setFailed(true)}
      className="w-8 h-8 rounded-full object-cover border border-purple-400/40 shrink-0"
    />
  );
}

export default function RecognitionCenterScreen() {
  const searchParams = useSearchParams();
  const previewMode = searchParams.get('preview') === 'demo';
  const initialTabParam = searchParams.get('tab');
  const { lang, setLang } = useLanguage();
  const isUr = lang === 'ur';

  const [activeCategory, setActiveCategory] = useState<RecognitionCategory>(
    initialTabParam === 'shining' || initialTabParam === 'honor' ? initialTabParam : 'wealth'
  );
  const [subTab, setSubTab] = useState<'overview' | 'leaderboard' | 'history'>('overview');

  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState<any>(null);
  const [summary, setSummary] = useState<UserRecognitionSummary | null>(null);
  const [vipProfile, setVipProfile] = useState<any>(null);
  const [honorFactors, setHonorFactors] = useState<HonorRecognitionFactor[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [lbPage, setLbPage] = useState(1);
  const [lbTotalPages, setLbTotalPages] = useState(1);
  const [historyData, setHistoryData] = useState<{
    levelHistory: any[];
    activityLedger: any[];
    honorRequests: any[];
  }>({ levelHistory: [], activityLedger: [], honorRequests: [] });

  const [liveNotifications, setLiveNotifications] = useState<string[]>([]);
  const [showAlertsDrawer, setShowAlertsDrawer] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [activeLevelUpModal, setActiveLevelUpModal] = useState<RecognitionLevelUpEventRecord | null>(null);

  // Honor request form state
  const [reqFactorKey, setReqFactorKey] = useState('account_achievements');
  const [reqEvidence, setReqEvidence] = useState('');
  const [submittingHonor, setSubmittingHonor] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const sseRef = useRef<EventSource | null>(null);
  const querySuffix = previewMode ? '?preview=demo' : '';

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sessRes, catRes] = await Promise.all([
        fetch('/api/auth/session'),
        fetch('/api/recognition/catalog'),
      ]);
      const sessJson = await sessRes.json().catch(() => ({}));
      const catJson = await catRes.json().catch(() => ({}));
      setAuthUser(sessJson?.user || null);
      setHonorFactors(catJson?.honorFactors || []);

      const useDemoQuery = sessJson?.user ? '' : querySuffix;
      const [statusRes, vipRes, histRes] = await Promise.all([
        fetch(`/api/recognition/status${useDemoQuery}`),
        fetch(`/api/vip/status${useDemoQuery}`),
        fetch(`/api/recognition/history${useDemoQuery}`),
      ]);

      if (statusRes.ok) {
        const stJson = await statusRes.json().catch(() => ({}));
        if (stJson?.summary) {
          setSummary(stJson.summary);
          if (stJson.summary.unacknowledgedLevelUps?.length > 0) {
            setActiveLevelUpModal(stJson.summary.unacknowledgedLevelUps[0]);
          }
        }
      }
      if (vipRes.ok) {
        const vpJson = await vipRes.json().catch(() => ({}));
        setVipProfile(vpJson?.vip || null);
      }
      if (histRes.ok) {
        const hsJson = await histRes.json().catch(() => ({}));
        setHistoryData({
          levelHistory: hsJson?.levelHistory || [],
          activityLedger: hsJson?.activityLedger || [],
          honorRequests: hsJson?.honorRequests || [],
        });
      }
    } catch (err) {
      console.error('Failed loading recognition data:', err);
    } finally {
      setLoading(false);
    }
  }, [querySuffix]);

  const loadLeaderboard = useCallback(async (cat: RecognitionCategory, pageNum: number) => {
    try {
      const res = await fetch(`/api/recognition/leaderboard?category=${cat}&page=${pageNum}&limit=10`);
      const data = await res.json().catch(() => ({}));
      if (data?.success) {
        setLeaderboard(data.entries || []);
        setLbTotalPages(data.totalPages || 1);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    loadLeaderboard(activeCategory, lbPage);
  }, [activeCategory, lbPage, loadLeaderboard]);

  // Real-time SSE listener for all levels:* events
  useEffect(() => {
    if (!authUser && !previewMode) return;
    const url = `/api/recognition/events${authUser ? '' : '?preview=demo'}`;
    const es = new EventSource(url);
    sseRef.current = es;

    const pushAlert = (msg: string) => {
      setLiveNotifications((prev) => [msg, ...prev].slice(0, 10));
    };

    es.addEventListener('levels:state_sync', (ev: MessageEvent) => {
      try {
        const d = JSON.parse(ev.data);
        if (d?.summary) setSummary(d.summary);
      } catch {}
    });

    const handleCatEvent = (label: string) => (ev: MessageEvent) => {
      try {
        const d = JSON.parse(ev.data);
        pushAlert(`${label} updated: Lv.${d.currentLevelNumber} (${d.currentScore} pts)`);
        loadAll();
      } catch {}
    };

    es.addEventListener('levels:wealth_updated', handleCatEvent('Wealth'));
    es.addEventListener('levels:shining_updated', handleCatEvent('Shining'));
    es.addEventListener('levels:honor_updated', handleCatEvent('Honor'));
    es.addEventListener('levels:benefits_updated', (ev: MessageEvent) => {
      try {
        const d = JSON.parse(ev.data);
        pushAlert(`Benefits unlocked for ${d.category} Lv.${d.levelNumber}`);
        loadAll();
      } catch {}
    });
    es.addEventListener('levels:level_up', (ev: MessageEvent) => {
      try {
        const d = JSON.parse(ev.data);
        pushAlert(`LEVEL UP! ${d.category} → Lv.${d.newLevelNumber} (${d.newLevelName})`);
        setActiveLevelUpModal({
          eventId: d.eventId,
          userId: d.userId,
          category: d.category,
          newLevelId: d.newLevelId,
          newLevelNumber: d.newLevelNumber,
          newLevelName: isUr ? d.newLevelNameUr || d.newLevelName : d.newLevelName,
          badgeImageUrl: d.badgeImageUrl,
          unlockedBenefits: d.unlockedBenefits || [],
          isAcknowledged: false,
          createdAt: new Date().toISOString(),
        });
        loadAll();
      } catch {}
    });

    return () => {
      es.close();
      sseRef.current = null;
    };
  }, [authUser, previewMode, isUr, loadAll]);

  const handleAckLevelUp = async (eventId: string) => {
    setActiveLevelUpModal(null);
    try {
      await fetch(`/api/recognition/level-ups/ack${authUser ? '' : querySuffix}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventIds: [eventId] }),
      });
    } catch {}
  };

  const handleUpdatePreference = async (patch: Record<string, boolean>) => {
    try {
      const res = await fetch(`/api/recognition/preferences${authUser ? '' : querySuffix}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (data?.success && summary) {
        setSummary({ ...summary, preferences: data.preferences });
        loadLeaderboard(activeCategory, lbPage);
        setToastMsg({ type: 'ok', text: isUr ? 'ترتیبات محفوظ ہوگئیں' : 'Preferences updated.' });
      }
    } catch {
      setToastMsg({ type: 'err', text: 'Failed to update preferences.' });
    }
  };

  const handleSubmitHonorRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingHonor(true);
    setToastMsg(null);
    try {
      const res = await fetch('/api/recognition/honor/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factorKey: reqFactorKey, evidenceSummary: reqEvidence }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setToastMsg({ type: 'err', text: data?.error || 'Could not submit Honor request.' });
        return;
      }
      setReqEvidence('');
      setToastMsg({
        type: 'ok',
        text: isUr
          ? 'اعزاز کی درخواست ایڈمن کی تصدیق کے لیے جمع کر دی گئی۔'
          : 'Honor recognition request queued for admin verification.',
      });
      await loadAll();
    } finally {
      setSubmittingHonor(false);
    }
  };

  const currentCatSummary: CategoryProgressSummary | null = summary ? summary[activeCategory] : null;
  const userAvatar =
    authUser?.avatarUrl && authUser.avatarUrl !== '/avatars/default.png'
      ? authUser.avatarUrl
      : '/assets/following/zara_live.png';
  const categoryLabels: Record<RecognitionCategory, { en: string; ur: string; metricEn: string; metricUr: string }> = {
    wealth: {
      en: 'Wealth',
      ur: 'دولت',
      metricEn: 'Eligible Paid Coins Spent',
      metricUr: 'خرچ کیے گئے مستند کوائنز',
    },
    shining: {
      en: 'Shining',
      ur: 'شائننگ',
      metricEn: 'Verified Gift Coins Sent',
      metricUr: 'بھیجے گئے تصدیق شدہ تحائف',
    },
    honor: {
      en: 'Honor',
      ur: 'اعزاز',
      metricEn: 'Approved Recognition Points',
      metricUr: 'منظور شدہ اعزازی پوائنٹس',
    },
  };

  const featuredTiers = currentCatSummary
    ? [...currentCatSummary.allTiers]
        .filter((t) => [60, 70, 80].includes(t.levelNumber))
        .sort((a, b) => b.levelNumber - a.levelNumber)
    : [];

  const filteredHistory = historyData.levelHistory.filter((h) => h.category === activeCategory);
  const filteredLedger = historyData.activityLedger.filter((l) => l.category === activeCategory);

  if (!loading && !authUser && !previewMode) {
    return (
      <main
        dir={isUr ? 'rtl' : 'ltr'}
        className="min-h-screen bg-[#0B031C] text-white flex items-center justify-center p-4"
      >
        <div className="max-w-sm w-full rounded-3xl bg-[#160B35] border border-purple-500/30 p-6 text-center shadow-2xl space-y-4">
          <div className="w-14 h-14 rounded-2xl mx-auto bg-gradient-to-tr from-[#FF2E74] to-[#FBBF24] flex items-center justify-center">
            <Crown className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-black">
            {isUr ? 'دولت، شائننگ اور اعزاز کا نظام' : 'Wealth, Shining and Honor'}
          </h1>
          <p className="text-xs text-white/65">
            {isUr
              ? 'اپنے تینوں الگ الگ درجات اور لیڈر بورڈ دیکھنے کے لیے لاگ ان کریں۔'
              : 'Sign in to view your separate Wealth, Shining, and Honor levels or preview in demo mode.'}
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href="/login?redirect=/recognition"
              className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-[#FF2E74] to-[#EC4899] text-white text-xs font-extrabold"
            >
              {isUr ? 'لاگ ان کریں' : 'Sign In'}
            </Link>
            <Link
              href="/recognition?preview=demo"
              className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white/85 text-xs font-bold"
            >
              {isUr ? 'ڈیمو موڈ دیکھیں' : 'Open Demo Preview'}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      dir={isUr ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#090218] text-white flex justify-center py-0 sm:py-6 px-0 sm:px-4"
    >
      <div className="w-full max-w-md lg:max-w-5xl bg-gradient-to-b from-[#130632] via-[#17093B] to-[#0B031C] sm:rounded-[38px] sm:border-[6px] sm:border-[#2B175A] sm:shadow-[0_0_90px_rgba(236,36,143,0.22)] overflow-hidden flex flex-col">
        {/* Top Bar matching 07_08_wealth_shining_and_honor.png */}
        <header className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Link
              href={previewMode ? '/wallet?preview=demo' : '/wallet'}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-white/80"
              title={isUr ? 'والٹ پر واپس جائیں' : 'Back to Wallet'}
            >
              <ArrowLeft className={`w-4 h-4 ${isUr ? 'rotate-180' : ''}`} />
            </Link>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#FF2E74] to-[#FBBF24] flex items-center justify-center shadow-[0_0_12px_rgba(255,46,116,0.45)] font-black text-xs">
              P
            </div>
            <span className="font-black text-base tracking-tight">Popo Live</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAlertsDrawer((s) => !s)}
              className="relative w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/85"
              title={isUr ? 'لائیو اطلاعات' : 'Real-Time Notifications'}
            >
              <Bell className="w-4 h-4" />
              {liveNotifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FF2E74]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowSettingsDrawer((s) => !s)}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/85"
              title={isUr ? 'رازداری اور آواز کی ترتیبات' : 'Privacy & Animation Settings'}
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              type="button"
              data-testid="toggle-lang-recognition"
              onClick={() => setLang(isUr ? 'en' : 'ur')}
              className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[11px] font-extrabold text-amber-200 flex items-center gap-1"
            >
              <Globe className="w-3 h-3" />
              <span>{isUr ? 'EN' : 'اردو'}</span>
            </button>
          </div>
        </header>

        {/* Live SSE Notification Drawer */}
        {showAlertsDrawer && (
          <div className="mx-4 mt-3 p-3 rounded-2xl bg-[#1F0F48] border border-pink-500/35 text-xs space-y-1.5">
            <div className="font-extrabold text-pink-300 flex items-center justify-between">
              <span>{isUr ? 'ریئل ٹائم لیول اپڈیٹس' : 'Real-Time Level Events (SSE)'}</span>
              <button type="button" onClick={() => setShowAlertsDrawer(false)} className="text-white/60 text-[10px]">
                Close
              </button>
            </div>
            {liveNotifications.length === 0 ? (
              <p className="text-white/50 text-[11px]">
                {isUr ? 'لائیو کنکشن فعال ہے۔' : 'Connected to live /api/recognition/events stream.'}
              </p>
            ) : (
              liveNotifications.map((n, i) => (
                <div key={i} className="text-[11px] text-white/85 bg-black/25 px-2.5 py-1 rounded-lg">
                  {n}
                </div>
              ))
            )}
          </div>
        )}

        {/* Settings & Privacy Drawer */}
        {showSettingsDrawer && summary && (
          <div className="mx-4 mt-3 p-3.5 rounded-2xl bg-[#1D0D44] border border-purple-400/35 text-xs space-y-2.5">
            <div className="font-extrabold text-purple-200">
              {isUr ? 'اینیمیشن، آواز اور لیڈر بورڈ رازداری' : 'Animation, Sound & Leaderboard Privacy'}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleUpdatePreference({ animationsEnabled: !summary.preferences.animationsEnabled })}
                className="px-3 py-2 rounded-xl bg-black/30 flex items-center justify-between text-white/85"
              >
                <span>{isUr ? 'لیول اپ اینیمیشن' : 'Animations'}</span>
                <span className={summary.preferences.animationsEnabled ? 'text-emerald-400 font-bold' : 'text-white/40'}>
                  {summary.preferences.animationsEnabled ? 'ON' : 'OFF'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleUpdatePreference({ soundEnabled: !summary.preferences.soundEnabled })}
                className="px-3 py-2 rounded-xl bg-black/30 flex items-center justify-between text-white/85"
              >
                <span className="flex items-center gap-1">
                  {summary.preferences.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  {isUr ? 'آواز' : 'Sound'}
                </span>
                <span className={summary.preferences.soundEnabled ? 'text-emerald-400 font-bold' : 'text-white/40'}>
                  {summary.preferences.soundEnabled ? 'ON' : 'OFF'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const key =
                    activeCategory === 'wealth'
                      ? 'hideWealthLeaderboard'
                      : activeCategory === 'shining'
                      ? 'hideShiningLeaderboard'
                      : 'hideHonorLeaderboard';
                  handleUpdatePreference({ [key]: !summary.preferences[key] });
                }}
                className="px-3 py-2 rounded-xl bg-black/30 flex items-center justify-between text-white/85"
              >
                <span>{isUr ? 'لیڈر بورڈ سے چھپائیں' : `Hide ${activeCategory}`}</span>
                <span
                  className={
                    summary.preferences[
                      activeCategory === 'wealth'
                        ? 'hideWealthLeaderboard'
                        : activeCategory === 'shining'
                        ? 'hideShiningLeaderboard'
                        : 'hideHonorLeaderboard'
                    ]
                      ? 'text-amber-300 font-bold'
                      : 'text-emerald-400 font-bold'
                  }
                >
                  {summary.preferences[
                    activeCategory === 'wealth'
                      ? 'hideWealthLeaderboard'
                      : activeCategory === 'shining'
                      ? 'hideShiningLeaderboard'
                      : 'hideHonorLeaderboard'
                  ]
                    ? 'HIDDEN'
                    : 'VISIBLE'}
                </span>
              </button>
            </div>
          </div>
        )}

        {toastMsg && (
          <div
            className={`mx-4 mt-3 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between ${
              toastMsg.type === 'ok'
                ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-200'
                : 'bg-rose-500/20 border border-rose-400/40 text-rose-200'
            }`}
          >
            <span>{toastMsg.text}</span>
            <button type="button" onClick={() => setToastMsg(null)} className="text-[10px] underline">
              OK
            </button>
          </div>
        )}

        {/* Main Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* 1. Three Strictly Separate Category Pill Switcher matching 07_08_wealth_shining_and_honor.png */}
          <div
            className="grid grid-cols-3 gap-1 p-1 rounded-full bg-[#1F1042] border border-purple-500/30 shadow-inner"
            role="tablist"
          >
            {(['wealth', 'shining', 'honor'] as RecognitionCategory[]).map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  data-testid={`tab-recognition-${cat}`}
                  onClick={() => {
                    setActiveCategory(cat);
                    setLbPage(1);
                  }}
                  className={`py-2 px-3 rounded-full text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                    active
                      ? 'bg-gradient-to-r from-[#FF2E74] to-[#EC4899] text-white shadow-[0_0_20px_rgba(255,46,116,0.55)]'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <RecognitionCategoryIcon category={cat} className="w-3.5 h-3.5" />
                  <span>{isUr ? categoryLabels[cat].ur : categoryLabels[cat].en}</span>
                </button>
              );
            })}
          </div>

          {/* Responsive 2-Column Layout on Desktop, Stacked 1:1 Reference Layout on Mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* LEFT COLUMN: Signature Wing Showcase Card (07_08 centerpiece) + Live Status Card */}
            <div className="lg:col-span-5 space-y-4">
              {/* Signature Wing Frame Showcase Box matching 07_08_wealth_shining_and_honor.png */}
              <div
                data-testid="wing-showcase-card"
                className="rounded-3xl bg-gradient-to-b from-[#1A093E]/95 to-[#110529]/95 border border-purple-400/25 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.45)] flex flex-col items-center gap-4"
              >
                {(featuredTiers.length >= 3
                  ? featuredTiers
                  : [
                      { levelNumber: 80, wingStyle: 'imperial_gold_wings', levelName: 'Imperial Gold', requiredThreshold: 200000 },
                      { levelNumber: 70, wingStyle: 'sapphire_violet_wings', levelName: 'Celestial Violet', requiredThreshold: 75000 },
                      { levelNumber: 60, wingStyle: 'rose_bronze_wings', levelName: 'Rose Bronze', requiredThreshold: 25000 },
                    ]
                ).map((t: any, idx: number) => (
                  <div key={t.levelNumber} className="flex flex-col items-center">
                    <LevelWingBadge
                      levelNumber={t.levelNumber}
                      wingStyle={t.wingStyle}
                      avatarUrl={
                        authUser?.avatarUrl && authUser.avatarUrl !== '/avatars/default.png'
                          ? authUser.avatarUrl
                          : SHOWCASE_AVATARS[idx % SHOWCASE_AVATARS.length]
                      }
                      label={`Lv.${t.levelNumber}`}
                      size={idx === 0 ? 'lg' : 'md'}
                      highlighted={currentCatSummary ? currentCatSummary.currentLevelNumber >= t.levelNumber : false}
                    />
                  </div>
                ))}
              </div>

              {/* Active Backend Status & Progress Bar Card */}
              {currentCatSummary && (
                <div
                  data-testid="current-level-progress-card"
                  className="rounded-3xl bg-[#180B39] border border-pink-500/35 p-4 space-y-3 shadow-lg"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-pink-300">
                        {isUr
                          ? `${categoryLabels[activeCategory].ur} موجودہ درجہ`
                          : `Your Verified ${categoryLabels[activeCategory].en} Level`}
                      </span>
                      <h2 className="text-lg font-black text-white flex items-center gap-2">
                        <span>
                          Lv.{currentCatSummary.currentLevelNumber} •{' '}
                          {isUr ? currentCatSummary.currentLevelNameUr : currentCatSummary.currentLevelName}
                        </span>
                      </h2>
                    </div>
                    <div className="px-2.5 py-1 rounded-xl bg-amber-400/15 border border-amber-400/40 text-amber-200 text-xs font-black">
                      {currentCatSummary.currentScore.toLocaleString()} pts
                    </div>
                  </div>

                  {/* Animated Backend-Driven Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-white/75">
                        {isUr ? categoryLabels[activeCategory].metricUr : categoryLabels[activeCategory].metricEn}
                      </span>
                      <span data-testid="progress-percent-text" className="text-pink-300">
                        {currentCatSummary.progressPercent}%
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-[#0C041E] overflow-hidden border border-purple-500/30">
                      <div
                        data-testid="progress-bar-fill"
                        className="h-full rounded-full bg-gradient-to-r from-[#FF2E74] via-[#EC4899] to-[#FBBF24] transition-all duration-700"
                        style={{ width: `${Math.min(100, Math.max(0, currentCatSummary.progressPercent))}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-white/55">
                      <span>
                        {isUr ? 'موجودہ:' : 'Progress:'} {currentCatSummary.currentScore.toLocaleString()}
                      </span>
                      <span>
                        {currentCatSummary.nextLevelNumber
                          ? `${isUr ? 'اگلا:' : 'Next:'} Lv.${currentCatSummary.nextLevelNumber} (${currentCatSummary.nextThreshold?.toLocaleString()})`
                          : isUr
                          ? 'اعلیٰ ترین درجہ مکمل'
                          : 'Max Tier Reached'}
                      </span>
                    </div>
                  </div>

                  {/* VIP Independence Notice (Section 11) */}
                  <div
                    data-testid="vip-independence-banner"
                    className="pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px]"
                  >
                    <div className="flex items-center gap-1.5 text-amber-200/90">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {vipProfile?.hasActiveVip
                          ? `VIP (${vipProfile.badgeLabel})`
                          : isUr
                          ? 'وی آئی پی الگ نظام ہے'
                          : 'VIP is separate from Levels'}
                      </span>
                    </div>
                    <Link
                      href={previewMode ? '/vip?preview=demo' : '/vip'}
                      className="text-pink-300 hover:underline font-bold flex items-center gap-0.5"
                    >
                      <span>{isUr ? 'وی آئی پی' : 'View VIP'}</span>
                      <ChevronRight className={`w-3.5 h-3.5 ${isUr ? 'rotate-180' : ''}`} />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Sub-tabs (Progress & Benefits / Leaderboard / History) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2 bg-[#12072D] p-1 rounded-2xl border border-purple-500/20">
                {(
                  [
                    { id: 'overview', en: 'Progress & Benefits', ur: 'ترقی اور مراعات', icon: Sparkles },
                    { id: 'leaderboard', en: `${categoryLabels[activeCategory].en} Rankings`, ur: 'لیڈر بورڈ', icon: Trophy },
                    { id: 'history', en: 'Level History', ur: 'ریکارڈ', icon: History },
                  ] as const
                ).map((st) => {
                  const Icon = st.icon;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      data-testid={`subtab-${st.id}`}
                      onClick={() => setSubTab(st.id)}
                      className={`flex-1 py-2 px-2.5 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition ${
                        subTab === st.id
                          ? 'bg-[#2C155E] text-white border border-pink-400/40'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 text-pink-400" />
                      <span>{isUr ? st.ur : st.en}</span>
                    </button>
                  );
                })}
              </div>

              {/* SUB-TAB 1: PROGRESS, BENEFITS, TIER LADDER & HONOR SUBMISSION */}
              {subTab === 'overview' && currentCatSummary && (
                <div className="space-y-4">
                  {/* Approved Non-Financial Benefits */}
                  <div className="rounded-2xl bg-[#160A36] border border-purple-500/25 p-4">
                    <div className="flex items-center justify-between mb-2.5">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-200 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-300" />
                        <span>
                          {isUr
                            ? `منظور شدہ ${categoryLabels[activeCategory].ur} مراعات`
                            : `Approved ${categoryLabels[activeCategory].en} Benefits`}
                        </span>
                      </h3>
                      <span className="text-[10px] text-emerald-300 font-bold">
                        {isUr ? 'غیر مالی بصری مراعات' : 'Non-Financial Visual Perks'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentCatSummary.approvedBenefits.map((b) => (
                        <div
                          key={b.benefitKey}
                          className="rounded-xl bg-[#0D0422] border border-emerald-400/25 p-2.5 flex items-start gap-2"
                        >
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-bold text-white">{isUr ? b.titleUr : b.title}</div>
                            <p className="text-[10px] text-white/60 mt-0.5">{isUr ? b.descriptionUr : b.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Honor Request Form (Only shown on Honor tab) */}
                  {activeCategory === 'honor' && authUser && (
                    <div className="rounded-2xl bg-[#160A36] border border-emerald-400/30 p-4">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-300 mb-2 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        <span>
                          {isUr
                            ? 'منظور شدہ اعزاز کی تصدیق جمع کروائیں'
                            : 'Submit Official Honor Recognition for Admin Review'}
                        </span>
                      </h3>
                      <form onSubmit={handleSubmitHonorRequest} className="space-y-2.5 text-xs">
                        <select
                          value={reqFactorKey}
                          onChange={(e) => setReqFactorKey(e.target.value)}
                          className="w-full bg-[#0D0422] border border-white/15 rounded-xl px-3 py-2 text-white"
                        >
                          {honorFactors.map((f) => (
                            <option key={f.factorKey} value={f.factorKey}>
                              {isUr ? f.titleUr : f.title} (+{f.defaultPoints} pts)
                            </option>
                          ))}
                        </select>
                        <textarea
                          value={reqEvidence}
                          onChange={(e) => setReqEvidence(e.target.value)}
                          rows={2}
                          required
                          placeholder={
                            isUr
                              ? 'تصدیق شدہ سرگرمی یا کمیونٹی خدمت کی تفصیل لکھیں...'
                              : 'Describe your verified platform achievement or contribution (min 8 chars)...'
                          }
                          className="w-full bg-[#0D0422] border border-white/15 rounded-xl px-3 py-2 text-white"
                        />
                        <button
                          type="submit"
                          disabled={submittingHonor}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold disabled:opacity-50"
                        >
                          {submittingHonor
                            ? isUr
                              ? 'جمع ہو رہا ہے...'
                              : 'Submitting...'
                            : isUr
                            ? 'ایڈمن جائزہ کے لیے بھیجیں'
                            : 'Submit for Authorized Admin Review'}
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Full Configurable Tier Ladder */}
                  <div className="rounded-2xl bg-[#160A36] border border-purple-500/25 p-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-200 mb-2.5">
                      {isUr
                        ? `${categoryLabels[activeCategory].ur} درجات کی ترتیب`
                        : `${categoryLabels[activeCategory].en} Configurable Tiers`}
                    </h3>
                    <div className="space-y-2">
                      {currentCatSummary.allTiers.map((tier) => {
                        const unlocked = currentCatSummary.currentScore >= tier.requiredThreshold;
                        const isCurrent = currentCatSummary.currentLevelId === tier.levelId;
                        return (
                          <div
                            key={tier.levelId}
                            className={`rounded-xl px-3 py-2.5 flex items-center justify-between border ${
                              isCurrent
                                ? 'bg-[#2B125D] border-pink-400/60'
                                : unlocked
                                ? 'bg-[#0E0526] border-emerald-400/25'
                                : 'bg-[#0C041E]/70 border-white/10 opacity-75'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black"
                                style={{
                                  backgroundColor: `${tier.borderColor}25`,
                                  border: `1px solid ${tier.borderColor}`,
                                  color: '#fff',
                                }}
                              >
                                {tier.levelNumber}
                              </div>
                              <div>
                                <div className="text-xs font-extrabold text-white">
                                  {isUr ? tier.levelNameUr : tier.levelName}
                                </div>
                                <div className="text-[10px] text-white/55">
                                  {tier.benefitKeys.length} {isUr ? 'مراعات' : 'benefits'} •{' '}
                                  {tier.requiredThreshold.toLocaleString()} pts
                                </div>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                isCurrent
                                  ? 'bg-[#FF2E74] text-white'
                                  : unlocked
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-white/10 text-white/50 flex items-center gap-1'
                              }`}
                            >
                              {isCurrent ? 'CURRENT' : unlocked ? 'UNLOCKED' : (
                                <>
                                  <Lock className="w-2.5 h-2.5" /> LOCKED
                                </>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-TAB 2: SEPARATE LEADERBOARD FOR ACTIVE CATEGORY */}
              {subTab === 'leaderboard' && (
                <div className="rounded-2xl bg-[#160A36] border border-purple-500/25 p-4 space-y-3" data-testid="recognition-leaderboard-panel">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-200 flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span>
                        {isUr
                          ? `${categoryLabels[activeCategory].ur} رینکنگ`
                          : `${categoryLabels[activeCategory].en} Leaderboard (Separate)`}
                      </span>
                    </h3>
                    <span className="text-[10px] text-white/50">Privacy-Protected</span>
                  </div>

                  {leaderboard.length === 0 ? (
                    <p className="text-xs text-white/50 py-4 text-center">No visible ranking entries yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {leaderboard.map((row) => (
                        <div
                          key={`${row.category}_${row.userId}`}
                          className="rounded-xl bg-[#0D0422] border border-white/10 px-3 py-2.5 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                                row.rank === 1
                                  ? 'bg-amber-400 text-black'
                                  : row.rank === 2
                                  ? 'bg-slate-300 text-black'
                                  : row.rank === 3
                                  ? 'bg-amber-700 text-white'
                                  : 'bg-white/10 text-white/75'
                              }`}
                            >
                              {row.rank}
                            </span>
                            <SafeAvatar src={row.avatarUrl} name={row.nickname} />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white truncate">{row.nickname}</div>
                              <div className="text-[10px] text-purple-200/80">
                                Lv.{row.levelNumber} • {isUr ? row.levelNameUr : row.levelName}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs font-black text-amber-300">{row.score.toLocaleString()}</div>
                            <div className="text-[10px] text-white/45">{row.category} score</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {lbTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-2 text-xs">
                      <button
                        type="button"
                        disabled={lbPage <= 1}
                        onClick={() => setLbPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1 rounded-lg bg-white/10 disabled:opacity-40"
                      >
                        Prev
                      </button>
                      <span className="text-white/60">
                        Page {lbPage} / {lbTotalPages}
                      </span>
                      <button
                        type="button"
                        disabled={lbPage >= lbTotalPages}
                        onClick={() => setLbPage((p) => Math.min(lbTotalPages, p + 1))}
                        className="px-3 py-1 rounded-lg bg-white/10 disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* SUB-TAB 3: LEVEL HISTORY & VERIFIED LEDGER */}
              {subTab === 'history' && (
                <div className="space-y-3" data-testid="recognition-history-panel">
                  <div className="rounded-2xl bg-[#160A36] border border-purple-500/25 p-4 space-y-2">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-200 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-pink-400" />
                      <span>
                        {isUr
                          ? `${categoryLabels[activeCategory].ur} درجات کی تاریخ`
                          : `${categoryLabels[activeCategory].en} Level Transitions`}
                      </span>
                    </h3>
                    {filteredHistory.length === 0 ? (
                      <p className="text-xs text-white/50">No level promotions yet in this category.</p>
                    ) : (
                      filteredHistory.map((h) => (
                        <div key={h.historyId} className="rounded-xl bg-[#0D0422] px-3 py-2 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-white">
                              Lv.{h.previousLevelNumber} → <span className="text-amber-300">Lv.{h.newLevelNumber} ({h.newLevelName})</span>
                            </div>
                            <div className="text-[10px] text-white/50">{h.changeReason}</div>
                          </div>
                          <span className="font-mono text-[10px] text-pink-200">{h.scoreAtChange.toLocaleString()} pts</span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="rounded-2xl bg-[#160A36] border border-purple-500/25 p-4 space-y-2">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-200">
                      {isUr ? 'تصدیق شدہ سرگرمی کا ریکارڈ' : 'Verified Activity Ledger'}
                    </h3>
                    {filteredLedger.length === 0 ? (
                      <p className="text-xs text-white/50">No verified activity entries yet.</p>
                    ) : (
                      filteredLedger.slice(0, 15).map((l) => (
                        <div key={l.ledgerId} className="rounded-xl bg-[#0D0422] px-3 py-2 flex items-center justify-between text-xs">
                          <div className="min-w-0 pr-2">
                            <div className="font-semibold text-white truncate">{l.reason}</div>
                            <div className="text-[10px] text-white/45">
                              {l.eventType} • {l.status.toUpperCase()}
                            </div>
                          </div>
                          <span
                            className={`font-black shrink-0 ${
                              l.scoreDelta > 0
                                ? 'text-emerald-300'
                                : l.scoreDelta < 0
                                ? 'text-rose-400'
                                : 'text-white/40'
                            }`}
                          >
                            {l.scoreDelta >= 0 ? `+${l.scoreDelta}` : l.scoreDelta}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Signature Bottom Badge matching 07_08_wealth_shining_and_honor.png */}
          <footer className="pt-3 pb-2 flex flex-col items-center text-center gap-1.5">
            <span className="px-4 py-1 rounded-full bg-gradient-to-r from-[#FF2E74] to-[#D946EF] text-white text-xs font-black tracking-wider shadow-[0_0_20px_rgba(255,46,116,0.45)]">
              P7.8
            </span>
            <h2 className="text-xl font-black tracking-tight text-white">
              {isUr ? 'دولت، شائننگ اور اعزاز' : 'Wealth, Shining and Honor'}
            </h2>
          </footer>
        </div>
      </div>

      {/* Confirmed Backend Level-Up Celebration Overlay */}
      <RecognitionLevelUpOverlay
        event={activeLevelUpModal}
        avatarUrl={userAvatar}
        animationsEnabled={summary ? summary.preferences.animationsEnabled : true}
        soundEnabled={summary ? summary.preferences.soundEnabled : true}
        isUr={isUr}
        onClose={handleAckLevelUp}
      />
    </main>
  );
}
