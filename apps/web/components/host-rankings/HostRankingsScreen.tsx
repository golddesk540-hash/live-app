'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpDown,
  Bell,
  ChevronRight,
  Crown,
  Heart,
  Info,
  ListTodo,
  MoreVertical,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Trophy,
  X,
} from 'lucide-react';
import { useUnreadNotificationsCount } from '@/components/notifications/useUnreadNotificationsCount';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { HostRankingDetailView } from './HostRankingDetailView';
import { HostRankingEmptyState } from './HostRankingEmptyState';
import { MyRankingCard } from './MyRankingCard';
import { TopThreePodium } from './TopThreePodium';
import {
  CURRENT_DEMO_HOST_ID,
  createInitialRankingsByPeriod,
  formatFullPoints,
} from './mockHostRankingsData';
import {
  HostRankingEntry,
  PeriodRankingDataset,
  RankingCategoryFilter,
  RankingPeriod,
  RankingSortOrder,
} from './types';

export const HostRankingsScreen: React.FC = () => {
  const unreadNotifications = useUnreadNotificationsCount();
  const [datasets, setDatasets] = useState<Record<RankingPeriod, PeriodRankingDataset>>(
    createInitialRankingsByPeriod
  );
  const [activePeriod, setActivePeriod] = useState<RankingPeriod>('daily');
  const [categoryFilter, setCategoryFilter] = useState<RankingCategoryFilter>('all');
  const [sortOrder, setSortOrder] = useState<RankingSortOrder>('rank_asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHostId, setSelectedHostId] = useState<string | null>(null);
  const [hideMyRanking, setHideMyRanking] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  const activeDataset = datasets[activePeriod];
  const baseEntries = activeDataset.entries;

  const selectedHost = useMemo(
    () => baseEntries.find((entry) => entry.id === selectedHostId) ?? null,
    [baseEntries, selectedHostId]
  );

  const myRankingEntry = useMemo(() => {
    if (hideMyRanking || baseEntries.length === 0) return null;
    return baseEntries.find((entry) => entry.hostId === CURRENT_DEMO_HOST_ID) ?? null;
  }, [baseEntries, hideMyRanking]);

  const topThreeEntries = useMemo(() => baseEntries.slice(0, 3), [baseEntries]);

  const visibleLeaderboardEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = baseEntries.filter((entry) => {
      if (categoryFilter === 'verified' && !entry.verified) return false;
      if (categoryFilter === 'rising' && entry.movement !== 'up' && entry.movement !== 'new') {
        return false;
      }
      if (q) {
        const hay = `${entry.username} ${entry.handle} ${entry.countryLabel}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const sorted = [...filtered].sort((a, b) =>
      sortOrder === 'rank_asc' ? a.rank - b.rank : b.rank - a.rank
    );
    return sorted;
  }, [baseEntries, categoryFilter, searchQuery, sortOrder]);

  const totalAcrossPeriodsAllEmpty =
    datasets.daily.entries.length === 0 &&
    datasets.weekly.entries.length === 0 &&
    datasets.monthly.entries.length === 0;

  const handleSelectHost = (hostId: string | null) => {
    setSelectedHostId(hostId);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  };

  const handleSelectPeriod = (period: RankingPeriod) => {
    setActivePeriod(period);
    setSelectedHostId(null);
  };

  const handleRestoreAllData = () => {
    setDatasets(createInitialRankingsByPeriod());
    setHideMyRanking(false);
    setCategoryFilter('all');
    setSortOrder('rank_asc');
    setSearchQuery('');
    setSelectedHostId(null);
    setShowOptionsMenu(false);
  };

  const handleClearAllPeriods = () => {
    setDatasets({
      daily: { ...datasets.daily, entries: [] },
      weekly: { ...datasets.weekly, entries: [] },
      monthly: { ...datasets.monthly, entries: [] },
    });
    setSelectedHostId(null);
    setShowOptionsMenu(false);
  };

  const handleClearSpecificPeriod = (period: RankingPeriod) => {
    const fresh = createInitialRankingsByPeriod();
    setDatasets({
      ...fresh,
      [period]: { ...fresh[period], entries: [] },
    });
    setActivePeriod(period);
    setSelectedHostId(null);
    setHideMyRanking(false);
    setShowOptionsMenu(false);
  };

  const handlePreviewMyRankingUnavailable = () => {
    setDatasets(createInitialRankingsByPeriod());
    setHideMyRanking(true);
    setSelectedHostId(null);
    setShowOptionsMenu(false);
  };

  const handleResetFilters = () => {
    setCategoryFilter('all');
    setSortOrder('rank_asc');
    setSearchQuery('');
  };

  const emptyPeriodKind =
    totalAcrossPeriodsAllEmpty
      ? 'no_data'
      : activePeriod === 'daily'
      ? 'no_daily'
      : activePeriod === 'weekly'
      ? 'no_weekly'
      : 'no_monthly';

  const renderMovementBadge = (entry: HostRankingEntry) => {
    if (entry.movement === 'up') {
      return (
        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[10px] font-extrabold text-emerald-300">
          <TrendingUp className="w-3 h-3" />
          <span>+{entry.movementDelta}</span>
        </span>
      );
    }
    if (entry.movement === 'down') {
      return (
        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-400/30 text-[10px] font-extrabold text-rose-300">
          <TrendingDown className="w-3 h-3" />
          <span>-{entry.movementDelta}</span>
        </span>
      );
    }
    if (entry.movement === 'new') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#FF1A6C]/20 border border-[#FF1A6C]/40 text-[10px] font-extrabold text-pink-200 uppercase">
          New
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-purple-200/60">
        —
      </span>
    );
  };

  return (
    <div
      data-testid="host-rankings-screen"
      className="min-h-screen bg-[#0D031B] text-white flex flex-col pb-10"
    >
      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b border-purple-400/20 bg-[#120624]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (selectedHost) {
                  setSelectedHostId(null);
                } else if (typeof window !== 'undefined' && window.history.length > 1) {
                  window.history.back();
                } else if (typeof window !== 'undefined') {
                  window.location.href = '/profile';
                }
              }}
              data-testid="host-rankings-back-btn"
              aria-label="Back"
              className="p-2 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-purple-100/90 transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <Link href="/live" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-full bg-[#1F0B3B] border-2 border-[#FF1A6C] flex items-center justify-center shadow-glow-pink">
                <div className="w-2.5 h-2.5 rounded-full bg-white" />
              </div>
              <div className="leading-tight flex items-center gap-1.5">
                <span className="font-black text-sm tracking-tight text-white">Popo Live</span>
                <span className="hidden xs:inline-block px-1.5 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/35 text-[9px] font-extrabold text-amber-300 uppercase tracking-wider">
                  Phase 9.5
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav aria-label="Creator Rankings Navigation" className="hidden lg:flex items-center gap-1.5">
            {[
              { href: '/live', label: 'Home', active: false },
              { href: '/host-rankings', label: 'Host Rankings', active: true },
              { href: '/new-host-pack', label: 'New-Host Pack', active: false },
              { href: '/daily-tasks', label: 'Daily Host Tasks', active: false },
              { href: '/task-level', label: 'Task Level', active: false },
              { href: '/profile', label: 'Profile', active: false },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  item.active
                    ? 'bg-gradient-to-r from-[#FF1A6C] to-[#EC4899] text-white shadow-glow-pink'
                    : 'text-purple-200/75 hover:text-white hover:bg-[#1E0E3D]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="relative p-2 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-purple-100/85 transition-colors"
            >
              <Bell className="w-4 h-4 text-[#FF6BA3]" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#FF1A6C] text-white text-[9px] font-black flex items-center justify-center border border-[#120624]">
                  {unreadNotifications}
                </span>
              )}
            </Link>

            <Link
              href="/fan-club"
              aria-label="Fan Club"
              className="p-2 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-purple-100/85 transition-colors"
            >
              <Heart className="w-4 h-4 text-[#FF6BA3]" />
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowOptionsMenu((prev) => !prev)}
                data-testid="host-rankings-options-btn"
                aria-label="Host Rankings Demo States"
                className="p-2 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-purple-100/85 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showOptionsMenu && (
                <div
                  data-testid="host-rankings-options-menu"
                  className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#180A31] border border-purple-400/25 shadow-2xl p-2 z-50 space-y-1"
                >
                  <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-200/60">
                    Rankings Empty States
                  </p>
                  <button
                    type="button"
                    onClick={handleRestoreAllData}
                    data-testid="menu-restore-rankings"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-purple-100 hover:bg-purple-500/20 flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#FF6BA3]" />
                    <span>Restore Sample Rankings</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAllPeriods}
                    data-testid="menu-empty-all-data"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-purple-500/20"
                  >
                    Preview No Ranking Data
                  </button>
                  <button
                    type="button"
                    onClick={() => handleClearSpecificPeriod('daily')}
                    data-testid="menu-empty-daily"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-purple-500/20"
                  >
                    Preview No Daily Records
                  </button>
                  <button
                    type="button"
                    onClick={() => handleClearSpecificPeriod('weekly')}
                    data-testid="menu-empty-weekly"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-purple-500/20"
                  >
                    Preview No Weekly Records
                  </button>
                  <button
                    type="button"
                    onClick={() => handleClearSpecificPeriod('monthly')}
                    data-testid="menu-empty-monthly"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-purple-500/20"
                  >
                    Preview No Monthly Records
                  </button>
                  <button
                    type="button"
                    onClick={handlePreviewMyRankingUnavailable}
                    data-testid="menu-empty-my-ranking"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-purple-500/20"
                  >
                    Preview My Ranking Unavailable
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-5 space-y-5">
        {/* Heading + Search */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Host Rankings
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/70 mt-1">
              Creator leaderboard · {activeDataset.periodWindowLabel}
            </p>
          </div>

          <div className="w-full sm:w-80">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search host by name or @handle..."
              aria-label="Search hosts"
              data-testid="host-rankings-search-input"
              leftIcon={<Search className="w-4 h-4 text-purple-300/70" />}
              rightIcon={
                searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="text-purple-300 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : undefined
              }
              className="bg-[#15082B] border-purple-400/25 focus:border-[#FF2E74]"
            />
          </div>
        </div>

        {/* Period Switcher Tabs (Daily | Weekly | Monthly) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Ranking Period Tabs"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#16082E] border border-purple-400/25 p-1"
          >
            {(['daily', 'weekly', 'monthly'] as RankingPeriod[]).map((period) => {
              const isActive = activePeriod === period;
              return (
                <button
                  key={period}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleSelectPeriod(period)}
                  data-testid={`period-tab-${period}`}
                  className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-black capitalize transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-[#FF1A6C] to-[#EC4899] text-white shadow-glow-pink'
                      : 'text-purple-200/75 hover:text-white hover:bg-[#220F42]'
                  }`}
                >
                  {period}
                </button>
              );
            })}
          </div>

          {/* Filter & Sort Controls (visible when period has data and not inside detail screen) */}
          {!selectedHost && baseEntries.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: 'all', label: 'All Hosts' },
                  { id: 'verified', label: 'Verified' },
                  { id: 'rising', label: 'Rising' },
                ] as { id: RankingCategoryFilter; label: string }[]
              ).map((chip) => {
                const active = categoryFilter === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setCategoryFilter(chip.id)}
                    data-testid={`filter-category-${chip.id}`}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-[#2C1356] border-[#FF2E74]/60 text-pink-200'
                        : 'bg-[#16082E] border-purple-400/20 text-purple-200/70 hover:text-white'
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() =>
                  setSortOrder((prev) => (prev === 'rank_asc' ? 'rank_desc' : 'rank_asc'))
                }
                data-testid="sort-position-btn"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#16082E] hover:bg-[#230E46] border border-purple-400/25 text-purple-100 transition-colors whitespace-nowrap"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-[#FF6BA3]" />
                <span>
                  {sortOrder === 'rank_asc'
                    ? `Rank: #1 → #${baseEntries.length}`
                    : `Rank: #${baseEntries.length} → #1`}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Main 12-Col Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left / Main Content */}
          <div className="lg:col-span-8 space-y-5">
            {selectedHost ? (
              <HostRankingDetailView
                entry={selectedHost}
                period={activePeriod}
                periodLabel={activeDataset.label}
                onBack={() => setSelectedHostId(null)}
              />
            ) : baseEntries.length === 0 ? (
              <HostRankingEmptyState
                kind={emptyPeriodKind}
                onAction={handleRestoreAllData}
              />
            ) : (
              <>
                {/* Mobile & Tablet My Ranking Card above Podium/Leaderboard */}
                <div className="lg:hidden">
                  <MyRankingCard
                    myEntry={myRankingEntry}
                    period={activePeriod}
                    periodLabel={activeDataset.label}
                    onInspectMyRanking={(entry) => handleSelectHost(entry.id)}
                    onRestoreMyRanking={() => setHideMyRanking(false)}
                    testIdPrefix="mobile-"
                  />
                </div>

                {/* Top Three Podium */}
                <TopThreePodium
                  entries={topThreeEntries}
                  onSelectHost={(entry) => handleSelectHost(entry.id)}
                />

                {/* Full Leaderboard Section */}
                <section
                  data-testid="full-leaderboard-section"
                  aria-label="Full Leaderboard"
                  className="rounded-3xl bg-[#130728] border border-purple-400/20 p-4 sm:p-5 space-y-3.5 shadow-xl"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-300" />
                      <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                        Leaderboard
                      </h2>
                    </div>
                    <span
                      data-testid="leaderboard-count-badge"
                      className="text-xs font-bold text-purple-200/70"
                    >
                      {visibleLeaderboardEntries.length} hosts shown
                    </span>
                  </div>

                  {visibleLeaderboardEntries.length === 0 ? (
                    <HostRankingEmptyState
                      kind="no_hosts_found"
                      searchQuery={searchQuery}
                      onAction={handleResetFilters}
                    />
                  ) : (
                    <div data-testid="leaderboard-rows" className="space-y-2">
                      {visibleLeaderboardEntries.map((entry) => {
                        const rankAccent =
                          entry.rank === 1
                            ? 'text-amber-300 bg-amber-400/15 border-amber-400/35'
                            : entry.rank === 2
                            ? 'text-slate-200 bg-slate-300/15 border-slate-300/35'
                            : entry.rank === 3
                            ? 'text-amber-500 bg-amber-600/15 border-amber-500/35'
                            : 'text-purple-200/75 bg-[#1C0D38] border-purple-400/20';

                        return (
                          <div
                            key={entry.id}
                            data-testid={`leaderboard-row-${entry.rank}`}
                            className={`flex items-center justify-between gap-3 p-3 sm:px-4 sm:py-3 rounded-2xl border transition-all ${
                              entry.isCurrentUser
                                ? 'bg-gradient-to-r from-[#26104B] to-[#1A0B35] border-[#FF2E74]/45'
                                : 'bg-[#190A33]/85 hover:bg-[#220E45] border-purple-400/15'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleSelectHost(entry.id)}
                              className="flex items-center gap-3 min-w-0 flex-1 text-left focus:outline-none"
                            >
                              <span
                                className={`w-8 h-8 rounded-xl border text-xs font-black flex items-center justify-center shrink-0 ${rankAccent}`}
                              >
                                {entry.rank}
                              </span>

                              <Avatar
                                src={entry.avatarUrl}
                                alt={entry.username}
                                size="sm"
                                ring={
                                  entry.rank === 1
                                    ? 'vip'
                                    : entry.isCurrentUser
                                    ? 'pink'
                                    : 'none'
                                }
                              />

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <p className="text-xs sm:text-sm font-extrabold text-white truncate">
                                    {entry.username}
                                  </p>
                                  {entry.verified && (
                                    <ShieldCheck
                                      aria-label="Verified Host"
                                      className="w-3.5 h-3.5 text-sky-400 shrink-0"
                                    />
                                  )}
                                  {entry.isCurrentUser && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-[#FF1A6C]/25 border border-[#FF1A6C]/45 text-[9px] font-black text-pink-200 shrink-0">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-purple-200/65 truncate">
                                  {entry.handle} · {entry.countryLabel}
                                </p>
                              </div>
                            </button>

                            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                              <div className="hidden xs:block">
                                {renderMovementBadge(entry)}
                              </div>

                              <div className="text-right">
                                <p className="text-xs sm:text-sm font-black text-amber-300 whitespace-nowrap">
                                  {formatFullPoints(entry.points)}
                                </p>
                              </div>

                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                                onClick={() => handleSelectHost(entry.id)}
                                data-testid={`view-host-profile-${entry.rank}`}
                                className="border-purple-400/30 bg-[#1B0C36] hover:bg-[#2B1454] text-[11px] px-2.5 py-1.5 h-auto whitespace-nowrap"
                              >
                                <span className="hidden sm:inline">View Profile</span>
                                <span className="sm:hidden">View</span>
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>

          {/* Right Sidebar */}
          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
            {/* Desktop My Ranking Card */}
            <div className="hidden lg:block">
              <MyRankingCard
                myEntry={myRankingEntry}
                period={activePeriod}
                periodLabel={activeDataset.label}
                onInspectMyRanking={(entry) => handleSelectHost(entry.id)}
                onRestoreMyRanking={() => setHideMyRanking(false)}
              />
            </div>

            {/* Period Comparison Helper Card */}
            <section className="rounded-3xl bg-[#130728] border border-purple-400/20 p-5 space-y-3.5 shadow-xl">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-300" />
                <h2 className="text-xs font-black uppercase tracking-wider text-purple-100">
                  Your Demo Positions
                </h2>
              </div>

              <div className="space-y-2">
                {(['daily', 'weekly', 'monthly'] as RankingPeriod[]).map((p) => {
                  const mine = datasets[p].entries.find(
                    (e) => e.hostId === CURRENT_DEMO_HOST_ID
                  );
                  const active = activePeriod === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleSelectPeriod(p)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl border text-left transition-colors ${
                        active
                          ? 'bg-[#251048] border-[#FF2E74]/45'
                          : 'bg-[#190A33] hover:bg-[#210E42] border-purple-400/15'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-extrabold text-white capitalize">
                          {p} Rankings
                        </p>
                        <p className="text-[11px] text-purple-200/65">
                          {mine ? formatFullPoints(mine.points) : 'Unavailable in preview'}
                        </p>
                      </div>
                      <span className="text-sm font-black text-amber-300">
                        {mine ? `#${mine.rank}` : '—'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Creator Tools & Frontend Scope Notice */}
            <section className="rounded-3xl bg-[#130728] border border-purple-400/20 p-5 space-y-3.5 shadow-xl">
              <h2 className="text-xs font-black uppercase tracking-wider text-purple-100">
                Creator Progress Tools
              </h2>

              <div className="space-y-2">
                <Link href="/daily-tasks" className="block">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    leftIcon={<ListTodo className="w-3.5 h-3.5 text-[#FF6BA3]" />}
                    className="w-full justify-start border-purple-400/25 bg-[#1B0C36] hover:bg-[#27114D]"
                  >
                    Open Daily Host Tasks
                  </Button>
                </Link>
                <Link href="/task-level" className="block">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    leftIcon={<Trophy className="w-3.5 h-3.5 text-amber-300" />}
                    className="w-full justify-start border-purple-400/25 bg-[#1B0C36] hover:bg-[#27114D]"
                  >
                    Open Task Level
                  </Button>
                </Link>
                <Link href="/new-host-pack" className="block">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    leftIcon={<Sparkles className="w-3.5 h-3.5 text-[#FF6BA3]" />}
                    className="w-full justify-start border-purple-400/25 bg-[#1B0C36] hover:bg-[#27114D]"
                  >
                    Open New-Host Pack
                  </Button>
                </Link>
              </div>

              <div className="rounded-2xl bg-[#1A0B35]/80 border border-purple-400/20 p-3 flex items-start gap-2 text-[11px] text-purple-200/75 leading-relaxed">
                <Info className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
                <span>
                  Frontend leaderboard preview using sample data. Does not calculate official
                  rankings, earnings, or rewards.
                </span>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
};
