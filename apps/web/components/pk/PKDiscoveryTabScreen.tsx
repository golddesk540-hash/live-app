'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  RefreshCw,
  Flame,
  Clock,
  Eye,
  Trophy,
  Users,
  Sparkles,
  Swords,
  Globe,
  ArrowRight,
  UserPlus,
  Radio,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import {
  PKDiscoveryTab,
  PKDiscoveryBattleItem,
  PKAvailableHostItem,
  PKDiscoveryResponse,
  formatPKViewers,
} from '@/lib/pk';

interface PKDiscoveryTabScreenProps {
  initialTab?: PKDiscoveryTab;
  initialLanguage?: 'en' | 'ur';
  onNavigateTab?: (tab: 'live' | 'party' | 'pk' | 'square') => void;
}

export default function PKDiscoveryTabScreen({
  initialTab = 'live',
  initialLanguage = 'en',
  onNavigateTab,
}: PKDiscoveryTabScreenProps) {
  const router = useRouter();
  const [lang, setLang] = useState<'en' | 'ur'>(initialLanguage);
  const [activeTab, setActiveTab] = useState<PKDiscoveryTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [battles, setBattles] = useState<PKDiscoveryBattleItem[]>([]);
  const [hosts, setHosts] = useState<PKAvailableHostItem[]>([]);
  const [counts, setCounts] = useState({
    all: 0,
    live: 4,
    availableHosts: 4,
    popular: 2,
    recent: 1,
    featured: 3,
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [invitedHostId, setInvitedHostId] = useState<string | null>(null);
  const [featuredActivity, setFeaturedActivity] = useState<any | null>(null);

  const isRtl = lang === 'ur';

  // 1. Fetch Discovery Data
  const fetchData = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams();
      params.set('tab', activeTab);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/pk/discovery?${params.toString()}`);
      const data: PKDiscoveryResponse = await res.json();

      if (data.success) {
        setBattles(data.battles || []);
        setHosts(data.hosts || []);
        if (data.counts) setCounts(data.counts);
      }

      // Fetch official active PK Activity Slot for Discovery banner
      try {
        const actRes = await fetch('/api/pk/activities?status=active&type=daily');
        const actData = await actRes.json();
        if (actData.success && actData.activities?.length > 0) {
          setFeaturedActivity(actData.activities[0]);
        }
      } catch {}
    } catch (err) {
      console.error('Failed to load PK discovery data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, searchQuery]);

  // 2. Real-Time SSE Subscription
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/pk/discovery/events');

      eventSource.addEventListener('pk:score_updated', (e) => {
        try {
          const update = JSON.parse(e.data);
          setBattles((prev) =>
            prev.map((b) => {
              if (b.id === update.battleId) {
                return {
                  ...b,
                  hostA: { ...b.hostA, score: update.hostAScore },
                  hostB: { ...b.hostB, score: update.hostBScore },
                  viewerCount: update.viewerCount ?? b.viewerCount,
                  viewersFormatted: formatPKViewers(update.viewerCount ?? b.viewerCount, isRtl),
                };
              }
              return b;
            })
          );
        } catch {}
      });

      eventSource.addEventListener('pk:timer_sync', (e) => {
        try {
          const sync = JSON.parse(e.data);
          setBattles((prev) =>
            prev.map((b) => {
              if (b.id === sync.battleId) {
                return {
                  ...b,
                  remainingSeconds: sync.remainingSeconds,
                  formattedTimer: sync.formattedTimer,
                  timerStatus: sync.timerStatus,
                };
              }
              return b;
            })
          );
        } catch {}
      });

      eventSource.addEventListener('pk:discovery_update', () => {
        fetchData();
      });
    } catch {}

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [isRtl]);

  // Handle Invite action for Available Hosts
  const handleInviteHost = async (host: PKAvailableHostItem) => {
    try {
      setInvitedHostId(host.id);
      const res = await fetch('/api/pk/invitation/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverHostId: host.id,
          battleType: '1v1',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTimeout(() => setInvitedHostId(null), 3000);
      } else {
        setInvitedHostId(null);
      }
    } catch {
      setInvitedHostId(null);
    }
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="relative w-full max-w-md mx-auto min-h-screen bg-[#0b071a] text-white flex flex-col justify-between overflow-x-hidden shadow-2xl font-sans select-none border-x border-[#231b3d]"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#180f33] via-[#0b071a] to-[#070412] pointer-events-none" />

      {/* TOP HEADER & NAVIGATION TABS (Matching 06_06_pk_discovery_tab.png) */}
      <div className="relative z-30 pt-4 px-4 pb-2 bg-[#100a26]/80 backdrop-blur-md sticky top-0 border-b border-[#251842]">
        {/* Main Category Tabs: Live | Party | PK | Square */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-4 text-sm font-semibold tracking-wide">
            <button
              onClick={() => onNavigateTab ? onNavigateTab('live') : router.push('/live')}
              className="text-white/60 hover:text-white transition-colors"
            >
              {isRtl ? 'لائیو' : 'Live'}
            </button>
            <button
              onClick={() => onNavigateTab ? onNavigateTab('party') : router.push('/party')}
              className="text-white/60 hover:text-white transition-colors"
            >
              {isRtl ? 'پارٹی' : 'Party'}
            </button>
            {/* PK Tab Active Pill */}
            <div className="relative">
              <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-[#ff2d78] to-[#ec4899] text-white font-extrabold text-sm shadow-[0_0_15px_rgba(255,45,120,0.5)] flex items-center gap-1">
                <Swords className="w-3.5 h-3.5" />
                {isRtl ? 'پی کے' : 'PK'}
              </span>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#ff2d78] rounded-full shadow-[0_0_8px_#ff2d78]" />
            </div>
            <button
              onClick={() => onNavigateTab ? onNavigateTab('square') : router.push('/square')}
              className="text-white/60 hover:text-white transition-colors"
            >
              {isRtl ? 'اسکوائر' : 'Square'}
            </button>
          </div>

          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
            className="text-xs font-bold px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/90 border border-white/10 flex items-center gap-1 shadow-sm"
            title="Toggle Language"
          >
            <Globe className="w-3 h-3 text-[#ff2d78]" />
            <span>{lang === 'en' ? 'اردو' : 'EN'}</span>
          </button>
        </div>

        {/* Section Heading: PK Battles */}
        <div className="flex items-center justify-between mt-1 mb-2">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white drop-shadow-sm">
              {isRtl ? 'پی کے مقابلے' : 'PK Battles'}
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#ff2d78]/20 text-[#ff2d78] border border-[#ff2d78]/30">
              {counts.live} Live
            </span>
          </div>

          <button
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#ff2d78]' : ''}`} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-3' : 'left-3'} w-4 h-4 text-white/40`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRtl ? 'میزبان کا نام، آئی ڈی یا ملک تلاش کریں...' : 'Search nickname, Host ID or country...'}
            className={`w-full bg-[#17102e] border border-[#2b1f4c] rounded-xl py-2 ${
              isRtl ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
            } text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#ff2d78] transition-colors`}
          />
        </div>

        {/* Discovery Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-medium">
          {[
            { id: 'live', labelEn: 'Live PK', labelUr: 'براہ راست', count: counts.live },
            { id: 'available_hosts', labelEn: 'Available Hosts', labelUr: 'دستیاب میزبان', count: counts.availableHosts },
            { id: 'popular', labelEn: 'Popular PK', labelUr: 'مقبول', count: counts.popular },
            { id: 'recent', labelEn: 'Recent PK', labelUr: 'حالیہ', count: counts.recent },
            { id: 'featured', labelEn: 'Featured', labelUr: 'نمایاں', count: counts.featured },
            { id: 'all', labelEn: 'All', labelUr: 'تمام', count: counts.all },
          ].map((tabItem) => (
            <button
              key={tabItem.id}
              onClick={() => setActiveTab(tabItem.id as PKDiscoveryTab)}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all duration-200 flex items-center gap-1 ${
                activeTab === tabItem.id
                  ? 'bg-[#ff2d78] text-white font-bold shadow-[0_0_10px_rgba(255,45,120,0.4)]'
                  : 'bg-[#1b1236] text-white/70 hover:text-white hover:bg-[#251846] border border-white/5'
              }`}
            >
              <span>{isRtl ? tabItem.labelUr : tabItem.labelEn}</span>
              {tabItem.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeTab === tabItem.id ? 'bg-black/30 text-white' : 'bg-white/10 text-white/60'
                  }`}
                >
                  {tabItem.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT LIST AREA */}
      <div className="relative z-20 flex-1 px-4 py-3 space-y-3 overflow-y-auto">
        {/* Module 6.7: PK Activity Slot Feature Banner */}
        {featuredActivity && !searchQuery && (
          <Link
            href="/pk/activity-slot"
            className="block group relative bg-gradient-to-r from-[#200d3d] via-[#1a0c33] to-[#250f44] border border-[#3d1d68] hover:border-[#ff2d78] rounded-2xl p-3 shadow-xl transition-all overflow-hidden"
          >
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#ff2d78]/15 rounded-full blur-xl pointer-events-none" />
            <div className="relative flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 flex items-center justify-center flex-shrink-0 shadow-md">
                  <div className="w-full h-full rounded-[10px] bg-[#220738] flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white">
                      {isRtl ? featuredActivity.titleUr : featuredActivity.title}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#ff2d78]/20 text-[#ff2d78]">
                      +50 Pts
                    </span>
                  </div>
                  <p className="text-[11px] text-white/70 font-semibold truncate">
                    {isRtl ? featuredActivity.subtitleUr : featuredActivity.subtitle}
                  </p>
                  <p className="text-[10px] text-white/50">
                    {isRtl
                      ? `${featuredActivity.targetBattles} / ${featuredActivity.currentBattles} مقابلے مکمل`
                      : `${featuredActivity.currentBattles} / ${featuredActivity.targetBattles} Battles`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#ff2d78] to-[#ec4899] text-white text-[11px] font-black shadow-md flex-shrink-0">
                <span>{isRtl ? 'ابھی شامل ہوں' : 'Join Now'}</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </Link>
        )}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-white/50 space-y-2">
            <RefreshCw className="w-7 h-7 animate-spin text-[#ff2d78]" />
            <p className="text-xs">{isRtl ? 'مقابلے لوڈ ہو رہے ہیں...' : 'Loading PK battles...'}</p>
          </div>
        ) : activeTab === 'available_hosts' ? (
          /* AVAILABLE HOSTS VIEW */
          hosts.length === 0 ? (
            <div className="py-16 text-center text-white/50 text-xs">
              {isRtl ? 'کوئی دستیاب میزبان نہیں ملا' : 'No available hosts found for PK'}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {hosts.map((host) => (
                <div
                  key={host.id}
                  className="bg-[#140d29] border border-[#2b1b4a] rounded-2xl p-3 flex items-center justify-between shadow-lg hover:border-[#ff2d78]/50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={host.avatarUrl}
                        alt={host.nickname}
                        className="w-12 h-12 rounded-full object-cover border-2 border-[#ff2d78]"
                      />
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#140d29]" />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-white">{host.nickname}</span>
                        <span className="text-xs">{host.flagEmoji}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-white/50 mt-0.5">
                        <span>ID: {host.poppoId}</span>
                        <span>•</span>
                        <span className="text-purple-300 font-medium">{host.viewersFormatted}</span>
                      </div>
                    </div>
                  </div>

                  {/* Invite Button */}
                  <button
                    onClick={() => handleInviteHost(host)}
                    disabled={invitedHostId === host.id}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                      invitedHostId === host.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gradient-to-r from-[#ff2d78] to-[#ec4899] text-white hover:opacity-90 shadow-[0_0_10px_rgba(255,45,120,0.3)]'
                    }`}
                  >
                    {invitedHostId === host.id ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'دعوت بھیجی گئی' : 'Invited'}</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'دعوت دیں' : 'Invite'}</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )
        ) : (
          /* ACTIVE / POPULAR / RECENT PK BATTLES VIEW (Exact match to 06_06_pk_discovery_tab.png) */
          battles.length === 0 ? (
            <div className="py-16 text-center text-white/50 text-xs">
              {isRtl ? 'کوئی پی کے مقابلہ نہیں ملا' : 'No PK battles match the criteria'}
            </div>
          ) : (
            battles.map((battle) => (
              <div
                key={battle.id}
                className="group relative bg-[#150e2c] border border-[#2d1c4f] rounded-2xl p-2.5 shadow-xl hover:border-[#ff2d78]/60 transition-all flex items-center gap-3"
              >
                {/* LEFT: Split Host Portraits with Centered Fiery VS Badge (Matching reference image) */}
                <div className="relative w-28 h-24 rounded-xl overflow-hidden flex-shrink-0 flex border border-white/10 shadow-md">
                  {/* Host A Thumbnail */}
                  <div className="relative w-1/2 h-full overflow-hidden">
                    <img
                      src={battle.hostA.avatarUrl}
                      alt={battle.hostA.nickname}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Host B Thumbnail */}
                  <div className="relative w-1/2 h-full overflow-hidden">
                    <img
                      src={battle.hostB.avatarUrl}
                      alt={battle.hostB.nickname}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Centered Fiery VS Badge */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#ff4500] via-[#ff2d78] to-[#ff007f] text-white font-black text-[10px] tracking-tight shadow-[0_0_8px_rgba(255,45,120,0.8)] border border-white/60 transform scale-95">
                      VS
                    </div>
                  </div>
                </div>

                {/* RIGHT: Matchup Info, Badges, Viewers & Watch Action */}
                <div className="flex-1 min-w-0 flex flex-col justify-between h-24 py-0.5">
                  {/* Top Row: Host Nickname & PK Live Badge */}
                  <div className="flex items-center justify-between gap-1">
                    <h2 className="text-sm font-extrabold text-white truncate">
                      {battle.hostA.nickname}
                    </h2>

                    {battle.status === 'active' && (
                      <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[#ff2d78] to-[#ec4899] text-white font-extrabold text-[10px] flex items-center gap-1 shadow-sm flex-shrink-0">
                        <Flame className="w-3 h-3 text-yellow-300 animate-pulse fill-yellow-300" />
                        <span>PK Live</span>
                      </span>
                    )}
                  </div>

                  {/* Matchup Subtitle */}
                  <p className="text-xs text-white/80 font-medium truncate">
                    {battle.hostA.nickname} vs {battle.hostB.nickname}
                  </p>

                  {/* Viewer Count & Timer */}
                  <div className="flex items-center justify-between text-[11px] text-white/50">
                    <span className="text-[#c084fc] font-semibold">
                      {battle.viewersFormatted}
                    </span>

                    {battle.status === 'active' && (
                      <div className="flex items-center gap-1 text-white/70">
                        <Clock className="w-3 h-3 text-[#ff2d78]" />
                        <span>{battle.formattedTimer}</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Row: Score Comparison & Watch Button */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    {/* Score Bar */}
                    <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden flex">
                      <div
                        className="bg-gradient-to-r from-[#ff2d78] to-[#ec4899] h-full transition-all duration-300"
                        style={{
                          width: `${
                            battle.hostA.score + battle.hostB.score === 0
                              ? 50
                              : Math.round(
                                  (battle.hostA.score / (battle.hostA.score + battle.hostB.score)) * 100
                                )
                          }%`,
                        }}
                      />
                      <div
                        className="bg-gradient-to-r from-[#3b82f6] to-[#06b6d4] h-full transition-all duration-300"
                        style={{
                          width: `${
                            battle.hostA.score + battle.hostB.score === 0
                              ? 50
                              : Math.round(
                                  (battle.hostB.score / (battle.hostA.score + battle.hostB.score)) * 100
                                )
                          }%`,
                        }}
                      />
                    </div>

                    {/* Watch Button */}
                    <Link
                      href={`/pk/battle/${battle.id}`}
                      className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-[#ff2d78] text-white text-[11px] font-bold transition-all flex items-center gap-1 hover:shadow-[0_0_8px_rgba(255,45,120,0.5)] border border-white/10"
                    >
                      <Eye className="w-3 h-3" />
                      <span>{isRtl ? 'دیکھیں' : 'Watch'}</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>

      {/* BOTTOM WATERMARK (Exact match to 06_06_pk_discovery_tab.png) */}
      <div className="relative z-30 py-4 px-4 flex justify-center bg-gradient-to-t from-[#090514] via-[#090514]/90 to-transparent">
        <div className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#831843] via-[#9d174d] to-[#be185d] text-white font-bold text-sm tracking-wide shadow-[0_4px_20px_rgba(190,24,93,0.4)] border border-pink-500/30">
          {isRtl ? '6.6 پی کے ڈسکوری ٹیب' : '6.6 PK Discovery Tab'}
        </div>
      </div>
    </div>
  );
}
