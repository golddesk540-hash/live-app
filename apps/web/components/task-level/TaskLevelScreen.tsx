'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Award,
  Bell,
  Calendar,
  CheckCircle2,
  Coins,
  Heart,
  HelpCircle,
  History,
  Home,
  Info,
  ListTodo,
  MoreVertical,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trophy,
  User,
} from 'lucide-react';
import { useUnreadNotificationsCount } from '@/components/notifications/useUnreadNotificationsCount';
import { Button } from '@/components/ui/Button';
import { LevelBenefitsSection } from './LevelBenefitsSection';
import { LevelCardList } from './LevelCardList';
import { LevelDetailView } from './LevelDetailView';
import { LevelHistorySection } from './LevelHistorySection';
import { LevelProgressHeroCard } from './LevelProgressHeroCard';
import { TaskLevelEmptyState } from './TaskLevelEmptyState';
import {
  DEFAULT_DEMO_POINTS,
  SAMPLE_LEVEL_BENEFITS,
  SAMPLE_LEVEL_HOST,
  createInitialLevelHistory,
  resolveTaskLevelState,
} from './mockTaskLevelData';
import {
  TaskLevelBenefit,
  TaskLevelFilterMode,
  TaskLevelHistoryRecord,
  TaskLevelViewTab,
} from './types';

export const TaskLevelScreen: React.FC = () => {
  const unreadNotifications = useUnreadNotificationsCount();
  const [demoPoints, setDemoPoints] = useState<number>(DEFAULT_DEMO_POINTS);
  const [viewTab, setViewTab] = useState<TaskLevelViewTab>('overview');
  const [filterMode, setFilterMode] = useState<TaskLevelFilterMode>('all');
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [history, setHistory] = useState<TaskLevelHistoryRecord[]>(
    createInitialLevelHistory
  );
  const [benefits, setBenefits] = useState<TaskLevelBenefit[]>(SAMPLE_LEVEL_BENEFITS);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 2800);
  };

  const resolved = useMemo(() => resolveTaskLevelState(demoPoints), [demoPoints]);

  const selectedLevel = useMemo(
    () => resolved.levels.find((l) => l.id === selectedLevelId) || null,
    [resolved.levels, selectedLevelId]
  );

  const handleUpdatePoints = (targetPoints: number, reasonLabel?: string) => {
    const safeNext = Math.max(0, Math.round(targetPoints));
    const prevResolved = resolveTaskLevelState(demoPoints);
    const nextResolved = resolveTaskLevelState(safeNext);

    setDemoPoints(safeNext);

    if (nextResolved.currentLevel.levelNumber > prevResolved.currentLevel.levelNumber) {
      const record: TaskLevelHistoryRecord = {
        id: `hist-demo-${Date.now()}`,
        previousLevelLabel: `${prevResolved.currentLevel.levelCode} · ${prevResolved.currentLevel.name}`,
        newLevelLabel: `${nextResolved.currentLevel.levelCode} · ${nextResolved.currentLevel.name}`,
        achievementDate: SAMPLE_LEVEL_HOST.sampleDateLabel,
        pointsAtAchievement: safeNext,
        achievementStatus: 'Achieved (Demo)',
      };
      setHistory((prev) => [record, ...prev]);
      showToast(
        `Level transition preview: ${nextResolved.currentLevel.levelCode} · ${nextResolved.currentLevel.name}!`
      );
      return;
    }

    if (reasonLabel) {
      showToast(reasonLabel);
    } else {
      showToast(`Updated sample points to ${safeNext.toLocaleString()} pts`);
    }
  };

  const handleResetDemo = () => {
    setDemoPoints(DEFAULT_DEMO_POINTS);
    setHistory(createInitialLevelHistory());
    setBenefits(SAMPLE_LEVEL_BENEFITS);
    setFilterMode('all');
    setSelectedLevelId(null);
    setViewTab('overview');
    setShowOptionsMenu(false);
    showToast('Restored default Task Level preview (650 pts · Level 03)');
  };

  const completedCount = resolved.levels.filter((l) => l.status === 'Completed').length;

  return (
    <div
      data-testid="task-level-screen"
      className="min-h-screen bg-[#0D031B] text-white flex flex-col pb-8 lg:pb-10"
    >
      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b border-purple-400/20 bg-[#120624]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (selectedLevelId) {
                  setSelectedLevelId(null);
                } else if (typeof window !== 'undefined' && window.history.length > 1) {
                  window.history.back();
                } else if (typeof window !== 'undefined') {
                  window.location.href = '/daily-tasks';
                }
              }}
              data-testid="task-level-back-btn"
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
                  Phase 9.3
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav aria-label="Host Progression Navigation" className="hidden lg:flex items-center gap-1.5">
            {[
              { href: '/live', label: 'Home', active: false },
              { href: '/earnings?preview=demo', label: 'Host Earnings', active: false },
              { href: '/daily-tasks', label: 'Daily Host Tasks', active: false },
              { href: '/task-level', label: 'Task Level', active: true },
              { href: '/earning-identity', label: 'Earning Identity', active: false },
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

          {/* Right Action Icons matching 09_03_task_level.png */}
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
                data-testid="task-level-options-btn"
                aria-label="Task Level Demo Options"
                className="p-2 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-purple-100/85 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showOptionsMenu && (
                <div
                  data-testid="task-level-options-menu"
                  className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#180A31] border border-purple-400/25 shadow-2xl p-2 z-50 space-y-1"
                >
                  <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-200/60">
                    Frontend Demo Presets
                  </p>
                  <button
                    type="button"
                    onClick={handleResetDemo}
                    data-testid="menu-reset-level-default"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-purple-100 hover:bg-purple-500/20 flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#FF6BA3]" />
                    <span>Restore Default (650 pts)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDemoPoints(50);
                      setViewTab('overview');
                      setFilterMode('Completed');
                      setSelectedLevelId(null);
                      setShowOptionsMenu(false);
                      showToast('Previewing 50 pts (No completed levels yet)');
                    }}
                    data-testid="menu-preview-zero-completed-levels"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-purple-500/20"
                  >
                    Preview 50 pts (No Completed)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDemoPoints(2600);
                      setViewTab('overview');
                      setFilterMode('Upcoming');
                      setSelectedLevelId(null);
                      setShowOptionsMenu(false);
                      showToast('Previewing 2,600 pts (Top tier achieved)');
                    }}
                    data-testid="menu-preview-all-tiers-max"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-purple-500/20"
                  >
                    Preview 2,600 pts (No Upcoming)
                  </button>
                  <div className="border-t border-purple-400/15 my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      setHistory([]);
                      setViewTab('history');
                      setSelectedLevelId(null);
                      setShowOptionsMenu(false);
                      showToast('Previewing empty level history');
                    }}
                    data-testid="menu-preview-empty-history"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-purple-500/20"
                  >
                    Preview Empty History
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBenefits([]);
                      setViewTab('benefits');
                      setSelectedLevelId(null);
                      setShowOptionsMenu(false);
                      showToast('Previewing empty benefits state');
                    }}
                    data-testid="menu-preview-empty-benefits"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-purple-500/20"
                  >
                    Preview Empty Benefits
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-5 space-y-5">
        {/* Title + Host Mini Card */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Task Level
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/70 mt-1">
              Track your host progress · Frontend preview only
            </p>
          </div>

          <div
            data-testid="task-level-host-profile"
            className="flex items-center gap-3 rounded-2xl bg-[#14082C] border border-purple-400/25 px-3.5 py-2.5 shrink-0"
          >
            <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-[#FF1A6C] to-amber-300 shrink-0">
              <div className="w-full h-full rounded-full overflow-hidden bg-[#14072A]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={SAMPLE_LEVEL_HOST.avatarUrl}
                  alt={SAMPLE_LEVEL_HOST.hostName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="min-w-0 leading-tight">
              <p className="text-xs sm:text-sm font-black text-white truncate">
                {SAMPLE_LEVEL_HOST.hostName}
              </p>
              <p className="text-[11px] text-purple-200/70 truncate">
                {SAMPLE_LEVEL_HOST.username} · {SAMPLE_LEVEL_HOST.sampleDateLabel}
              </p>
            </div>
          </div>
        </div>

        {/* Two-Column Responsive Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
          {/* LEFT / PRIMARY */}
          <div className="space-y-5 min-w-0">
            {selectedLevelId ? (
              selectedLevel ? (
                <LevelDetailView
                  level={selectedLevel}
                  currentPoints={resolved.safePoints}
                  benefits={benefits}
                  onBack={() => setSelectedLevelId(null)}
                  onJumpDemoToLevel={(pts) =>
                    handleUpdatePoints(pts, `Previewing session at ${pts.toLocaleString()} demo pts`)
                  }
                />
              ) : (
                <TaskLevelEmptyState
                  kind="no_level_details"
                  onAction={() => setSelectedLevelId(null)}
                />
              )
            ) : (
              <>
                <LevelProgressHeroCard
                  currentPoints={resolved.safePoints}
                  currentLevel={resolved.currentLevel}
                  nextLevel={resolved.nextLevel}
                  overallPercent={resolved.overallPercent}
                  remainingToNext={resolved.remainingToNext}
                  onAddDemoPoints={(delta) => handleUpdatePoints(resolved.safePoints + delta)}
                  onResetDemoPoints={handleResetDemo}
                  onInspectCurrentLevel={() => setSelectedLevelId(resolved.currentLevel.id)}
                />

                {/* View Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  {(
                    [
                      { id: 'overview', label: 'Level Progress', icon: Trophy },
                      { id: 'benefits', label: 'Level Benefits', icon: Award },
                      { id: 'history', label: `Level History (${history.length})`, icon: History },
                    ] as { id: TaskLevelViewTab; label: string; icon: React.ElementType }[]
                  ).map((tab) => {
                    const TabIcon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setViewTab(tab.id)}
                        data-testid={`task-level-tab-${tab.id}`}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-extrabold whitespace-nowrap transition-all ${
                          viewTab === tab.id
                            ? 'bg-gradient-to-r from-[#FF1A6C] to-[#EC4899] text-white shadow-glow-pink'
                            : 'bg-[#190B33] text-purple-200/75 border border-purple-400/20 hover:text-white'
                        }`}
                      >
                        <TabIcon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {viewTab === 'overview' && (
                  <LevelCardList
                    levels={resolved.levels}
                    filterMode={filterMode}
                    onChangeFilter={setFilterMode}
                    onSelectLevel={(id) => setSelectedLevelId(id)}
                    onResetDemoPoints={handleResetDemo}
                  />
                )}

                {viewTab === 'benefits' && (
                  <LevelBenefitsSection
                    benefits={benefits}
                    currentLevelNumber={resolved.currentLevel.levelNumber}
                    onRestoreBenefits={() => setBenefits(SAMPLE_LEVEL_BENEFITS)}
                  />
                )}

                {viewTab === 'history' && (
                  <LevelHistorySection
                    history={history}
                    onRestoreHistory={() => setHistory(createInitialLevelHistory())}
                  />
                )}
              </>
            )}
          </div>

          {/* RIGHT SIDEBAR (Desktop Summary & Rules) */}
          <aside className="space-y-5 lg:sticky lg:top-24">
            <section
              data-testid="task-level-summary-sidebar"
              className="rounded-3xl bg-[#130728] border border-purple-400/20 p-5 space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-wider text-purple-200/75">
                  Level Summary
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/35 text-[10px] font-bold text-amber-300">
                  Demo Mode
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-purple-400/15">
                  <span className="text-purple-200/70">Current Level</span>
                  <span className="font-black text-amber-300">
                    {resolved.currentLevel.levelCode} · {resolved.currentLevel.name}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-purple-400/15">
                  <span className="text-purple-200/70">Sample Points</span>
                  <span className="font-bold text-white">
                    {resolved.safePoints.toLocaleString()} pts
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-purple-400/15">
                  <span className="text-purple-200/70">Tiers Completed</span>
                  <span className="font-bold text-emerald-300">
                    {completedCount} of {resolved.levels.length}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-purple-200/70">History Events</span>
                  <span className="font-bold text-white">{history.length}</span>
                </div>
              </div>

              <div className="pt-1 flex flex-col gap-2">
                <Link
                  href="/daily-tasks"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[#1C0D38] hover:bg-[#27134D] border border-purple-400/30 text-xs font-bold text-purple-100 transition-colors"
                >
                  <ListTodo className="w-3.5 h-3.5 text-[#FF6BA3]" />
                  <span>Open Daily Host Tasks</span>
                </Link>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  leftIcon={<RotateCcw className="w-3.5 h-3.5 text-[#FF6BA3]" />}
                  onClick={handleResetDemo}
                  data-testid="sidebar-reset-level-btn"
                  className="w-full border-purple-400/25 bg-transparent hover:bg-white/5 text-xs whitespace-nowrap"
                >
                  Reset Level Demo
                </Button>
              </div>
            </section>

            <section className="rounded-3xl bg-[#130728] border border-purple-400/20 p-5 space-y-3 shadow-xl">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#FF6BA3]" />
                <h2 className="text-sm font-extrabold text-white">Sample Threshold Notice</h2>
              </div>
              <p className="text-xs text-purple-200/75 leading-relaxed">
                Sample point thresholds (100, 300, 900, 1,500, 2,500) are local frontend placeholders for testing level transitions and UI progress bars.
              </p>
              <div className="rounded-2xl bg-[#190B34] border border-purple-400/20 p-3 flex items-start gap-2 text-[11px] text-purple-200/75">
                <Info className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <span>
                  Official host level requirements, privileges, and commission policies await approved backend integration.
                </span>
              </div>
              <Link
                href="/help"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF85B3] hover:underline"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Help & Creator Policy FAQ ↗</span>
              </Link>
            </section>
          </aside>
        </div>

        {/* Inline Mobile Quick Nav */}
        <footer className="lg:hidden mt-6 pt-4 border-t border-purple-400/20">
          <div className="grid grid-cols-5 gap-1 rounded-2xl bg-[#130728] border border-purple-400/20 p-2">
            {[
              { href: '/live', label: 'Home', icon: Home, active: false },
              { href: '/daily-tasks', label: 'Tasks', icon: ListTodo, active: false },
              { href: '/task-level', label: 'Level', icon: Trophy, active: true },
              { href: '/earning-identity', label: 'Identity', icon: ShieldCheck, active: false },
              { href: '/profile', label: 'Profile', icon: User, active: false },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[10px] font-bold transition-colors ${
                  item.active
                    ? 'bg-[#FF1A6C]/20 text-[#FF85B3]'
                    : 'text-purple-200/65 hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4 mb-0.5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </footer>
      </main>

      {/* Feedback Toast */}
      {toast && (
        <div
          role="status"
          data-testid="task-level-toast"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-[#240F4A] border border-[#FF1A6C]/55 text-xs font-extrabold text-white shadow-2xl flex items-center gap-2 max-w-[92vw]"
        >
          <Sparkles className="w-4 h-4 text-[#FF6BA3] shrink-0" />
          <span className="truncate">{toast}</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        </div>
      )}
    </div>
  );
};
