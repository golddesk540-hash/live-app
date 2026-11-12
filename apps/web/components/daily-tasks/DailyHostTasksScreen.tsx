'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bell,
  Calendar,
  CheckCircle2,
  Coins,
  Compass,
  Heart,
  HelpCircle,
  Home,
  Info,
  ListTodo,
  Loader2,
  MoreVertical,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { useUnreadNotificationsCount } from '@/components/notifications/useUnreadNotificationsCount';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CompletedTasksSection } from './CompletedTasksSection';
import { DailyProgressSummary } from './DailyProgressSummary';
import { DailyTaskCard } from './DailyTaskCard';
import { DailyTaskEmptyState } from './DailyTaskEmptyState';
import { TaskDetailView } from './TaskDetailView';
import {
  SAMPLE_HOST_PROFILE,
  SAMPLE_TASK_DATE,
  TASK_CATEGORY_OPTIONS,
  computeDailyTaskSummary,
  createInitialDailyTasks,
} from './mockDailyTasksData';
import { DailyTaskItem, TaskCategoryId, TaskStatus, TaskViewTab } from './types';

export const DailyHostTasksScreen: React.FC = () => {
  const unreadNotifications = useUnreadNotificationsCount();
  const [tasks, setTasks] = useState<DailyTaskItem[]>(createInitialDailyTasks);
  const [viewTab, setViewTab] = useState<TaskViewTab>('all');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategoryId | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showLoadingPreview, setShowLoadingPreview] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 2600);
  };

  const summary = useMemo(() => computeDailyTaskSummary(tasks), [tasks]);

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) || null,
    [tasks, selectedTaskId]
  );

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tasks.filter((task) => {
      if (viewTab === 'active' && task.status === 'Completed') return false;
      if (viewTab === 'completed' && task.status !== 'Completed') return false;
      if (selectedCategory !== 'all' && task.category !== selectedCategory) return false;
      if (selectedStatus !== 'all' && task.status !== selectedStatus) return false;
      if (q) {
        const hay = `${task.title} ${task.description} ${task.categoryLabel} ${task.status}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tasks, viewTab, selectedCategory, selectedStatus, searchQuery]);

  const handleIncrementProgress = (taskId: string) => {
    let updatedTitle = '';
    let completedNow = false;

    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId || task.status === 'Locked') return task;
        const nextProgress = Math.min(
          task.targetProgress,
          task.currentProgress + task.stepIncrement
        );
        const isDone = nextProgress >= task.targetProgress;
        updatedTitle = task.title;
        completedNow = isDone;
        return {
          ...task,
          currentProgress: nextProgress,
          status: isDone ? 'Completed' : 'In Progress',
          completedDate: isDone ? SAMPLE_TASK_DATE : null,
        };
      })
    );

    if (updatedTitle) {
      showToast(
        completedNow
          ? `Demo task completed: ${updatedTitle}`
          : `Updated sample progress for: ${updatedTitle}`
      );
    }
  };

  const handleMarkComplete = (taskId: string) => {
    let updatedTitle = '';
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId || task.status === 'Locked') return task;
        updatedTitle = task.title;
        return {
          ...task,
          currentProgress: task.targetProgress,
          status: 'Completed',
          completedDate: SAMPLE_TASK_DATE,
        };
      })
    );
    if (updatedTitle) {
      showToast(`Marked complete (demo): ${updatedTitle}`);
    }
  };

  const handleResetTask = (taskId: string) => {
    const template = createInitialDailyTasks().find((t) => t.id === taskId);
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        if (template && template.status !== 'Completed') {
          return { ...template };
        }
        return {
          ...task,
          currentProgress: 0,
          status: 'Not Started',
          completedDate: null,
        };
      })
    );
    showToast('Reset task to sample initial state');
  };

  const handleUnlockPreview = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId && task.status === 'Locked'
          ? {
              ...task,
              status: 'Not Started',
              unlockRequirementLabel: undefined,
            }
          : task
      )
    );
    showToast('Unlocked task preview in local session');
  };

  const handleResetAllDemo = () => {
    setTasks(createInitialDailyTasks());
    setViewTab('all');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setSearchQuery('');
    setSelectedTaskId(null);
    setShowLoadingPreview(false);
    setShowOptionsMenu(false);
    showToast('Restored default sample Daily Host Tasks');
  };

  const handlePreviewAllEmpty = () => {
    setTasks([]);
    setSelectedTaskId(null);
    setShowOptionsMenu(false);
    showToast('Previewing empty Daily Host Tasks state');
  };

  const handlePreviewZeroCompleted = () => {
    setTasks((prev) => {
      const base = prev.length > 0 ? prev : createInitialDailyTasks();
      return base.map((task) =>
        task.status === 'Completed'
          ? {
              ...task,
              currentProgress: Math.max(0, task.targetProgress - task.stepIncrement),
              status: task.targetProgress <= 1 ? 'Not Started' : 'In Progress',
              completedDate: null,
            }
          : task
      );
    });
    setViewTab('completed');
    setSelectedTaskId(null);
    setShowOptionsMenu(false);
    showToast('Previewing zero completed tasks state');
  };

  const handlePreviewAllCompleted = () => {
    setTasks((prev) => {
      const base = prev.length > 0 ? prev : createInitialDailyTasks();
      return base.map((task) => ({
        ...task,
        currentProgress: task.targetProgress,
        status: 'Completed',
        completedDate: SAMPLE_TASK_DATE,
      }));
    });
    setViewTab('active');
    setSelectedTaskId(null);
    setShowOptionsMenu(false);
    showToast('Previewing all tasks completed state');
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedStatus('all');
    setSearchQuery('');
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<TaskCategoryId, { total: number; done: number }> = {
      live_streaming: { total: 0, done: 0 },
      gift_activity: { total: 0, done: 0 },
      community: { total: 0, done: 0 },
    };
    tasks.forEach((task) => {
      counts[task.category].total += 1;
      if (task.status === 'Completed') counts[task.category].done += 1;
    });
    return counts;
  }, [tasks]);

  const activeCategoryLabel =
    selectedCategory === 'all'
      ? undefined
      : TASK_CATEGORY_OPTIONS.find((c) => c.id === selectedCategory)?.label;

  return (
    <div
      data-testid="daily-host-tasks-screen"
      className="min-h-screen bg-[#0D031B] text-white flex flex-col pb-8 lg:pb-10"
    >
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-purple-400/20 bg-[#120624]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (selectedTaskId) {
                  setSelectedTaskId(null);
                } else if (typeof window !== 'undefined' && window.history.length > 1) {
                  window.history.back();
                } else if (typeof window !== 'undefined') {
                  window.location.href = '/earnings';
                }
              }}
              data-testid="daily-tasks-back-btn"
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
                  Phase 9.2
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav aria-label="Creator Tools Navigation" className="hidden lg:flex items-center gap-1.5">
            {[
              { href: '/live', label: 'Home', active: false },
              { href: '/earnings?preview=demo', label: 'Host Earnings', active: false },
              { href: '/daily-tasks', label: 'Daily Host Tasks', active: true },
              { href: '/earning-identity', label: 'Earning Identity', active: false },
              { href: '/square', label: 'Square', active: false },
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

          {/* Right Header Icons matching 09_02_daily_host_tasks.png */}
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
                data-testid="daily-tasks-options-btn"
                aria-label="Demo State Options"
                className="p-2 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-purple-100/85 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showOptionsMenu && (
                <div
                  data-testid="daily-tasks-options-menu"
                  className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#180A31] border border-purple-400/25 shadow-2xl p-2 z-50 space-y-1"
                >
                  <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-200/60">
                    Frontend State Previews
                  </p>
                  <button
                    type="button"
                    onClick={handleResetAllDemo}
                    data-testid="menu-restore-default-tasks"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-purple-100 hover:bg-purple-500/20 flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#FF6BA3]" />
                    <span>Restore Default Sample Tasks</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePreviewAllEmpty}
                    data-testid="menu-preview-empty-tasks"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-purple-500/20"
                  >
                    Preview Empty Tasks State
                  </button>
                  <button
                    type="button"
                    onClick={handlePreviewZeroCompleted}
                    data-testid="menu-preview-zero-completed"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-purple-500/20"
                  >
                    Preview Zero Completed State
                  </button>
                  <button
                    type="button"
                    onClick={handlePreviewAllCompleted}
                    data-testid="menu-preview-all-completed"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-purple-500/20"
                  >
                    Preview All Completed State
                  </button>
                  <div className="border-t border-purple-400/15 my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      setShowLoadingPreview((prev) => !prev);
                      setShowOptionsMenu(false);
                    }}
                    data-testid="menu-toggle-loading-preview"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-amber-300 hover:bg-purple-500/20 flex items-center gap-2"
                  >
                    <Loader2 className="w-3.5 h-3.5" />
                    <span>
                      {showLoadingPreview ? 'Exit Loading State' : 'Preview Loading State'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-5 space-y-5">
        {/* Host Header + Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Daily Host Tasks
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/70 mt-1">
              Your activity goals · Frontend preview only
            </p>
          </div>

          {/* Host Mini Profile Card */}
          <div
            data-testid="daily-tasks-host-profile"
            className="flex items-center gap-3 rounded-2xl bg-[#14082C] border border-purple-400/25 px-3.5 py-2.5 shrink-0"
          >
            <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-[#FF1A6C] to-[#EC4899] shrink-0">
              <div className="w-full h-full rounded-full overflow-hidden bg-[#14072A]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={SAMPLE_HOST_PROFILE.avatarUrl}
                  alt={SAMPLE_HOST_PROFILE.hostName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="min-w-0 leading-tight">
              <p className="text-xs sm:text-sm font-black text-white truncate">
                {SAMPLE_HOST_PROFILE.hostName}
              </p>
              <p className="text-[11px] text-purple-200/70 truncate">
                {SAMPLE_HOST_PROFILE.username} · {SAMPLE_HOST_PROFILE.sampleDateLabel}
              </p>
            </div>
          </div>
        </div>

        {/* Two-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
          {/* LEFT / PRIMARY CONTENT */}
          <div className="space-y-5 min-w-0">
            {/* Progress Summary Hero & Cards (shown on Dashboard/List views) */}
            {!selectedTask && (
              <DailyProgressSummary summary={summary} sampleDate={SAMPLE_TASK_DATE} />
            )}

            {/* Loading State Preview */}
            {showLoadingPreview ? (
              <section
                data-testid="daily-tasks-loading-state"
                className="rounded-3xl bg-[#130728] border border-purple-400/20 p-5 sm:p-6 space-y-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Previewing Loading Skeleton State</span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowLoadingPreview(false)}
                    data-testid="exit-loading-preview-btn"
                  >
                    Exit Loading Preview
                  </Button>
                </div>

                {[1, 2, 3].map((row) => (
                  <div
                    key={row}
                    className="rounded-2xl bg-[#1B0C37] border border-purple-400/15 p-4 space-y-3 animate-pulse"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-400/15" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 w-2/3 rounded bg-purple-400/20" />
                        <div className="h-2.5 w-1/2 rounded bg-purple-400/10" />
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-purple-400/15" />
                  </div>
                ))}
              </section>
            ) : selectedTask ? (
              /* Task Details View */
              <TaskDetailView
                task={selectedTask}
                onBack={() => setSelectedTaskId(null)}
                onIncrementProgress={handleIncrementProgress}
                onMarkComplete={handleMarkComplete}
                onResetTask={handleResetTask}
                onUnlockPreview={handleUnlockPreview}
              />
            ) : (
              /* Filters + Task List / Completed Section */
              <div className="space-y-4">
                {/* Active / Completed / All Tabs + Search */}
                <div className="rounded-3xl bg-[#130728] border border-purple-400/20 p-4 space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                      {(
                        [
                          { id: 'all', label: `All Tasks (${summary.totalTasks})` },
                          { id: 'active', label: `Active Tasks (${summary.activeTasks})` },
                          { id: 'completed', label: `Completed (${summary.completedTasks})` },
                        ] as { id: TaskViewTab; label: string }[]
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            setViewTab(tab.id);
                            setSelectedStatus('all');
                          }}
                          data-testid={`daily-tasks-tab-${tab.id}`}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all ${
                            viewTab === tab.id
                              ? 'bg-gradient-to-r from-[#FF1A6C] to-[#EC4899] text-white shadow-glow-pink'
                              : 'bg-[#1D0D3B] text-purple-200/75 border border-purple-400/20 hover:text-white'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="relative w-full sm:w-60">
                      <Search className="w-3.5 h-3.5 text-purple-300/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search daily tasks..."
                        aria-label="Search daily tasks"
                        data-testid="daily-tasks-search-input"
                        className="pl-8 pr-8 py-2 text-xs rounded-xl bg-[#1B0C36] border-purple-400/25"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          data-testid="daily-tasks-search-clear"
                          aria-label="Clear search"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-purple-200/70 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('all')}
                      data-testid="category-filter-all"
                      className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                        selectedCategory === 'all'
                          ? 'bg-purple-500/30 border border-purple-300/50 text-white'
                          : 'bg-[#1A0B34] border border-purple-400/20 text-purple-200/70 hover:text-white'
                      }`}
                    >
                      All Categories
                    </button>
                    {TASK_CATEGORY_OPTIONS.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        data-testid={`category-filter-${cat.id}`}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                          selectedCategory === cat.id
                            ? 'bg-purple-500/30 border border-purple-300/50 text-white'
                            : 'bg-[#1A0B34] border border-purple-400/20 text-purple-200/70 hover:text-white'
                        }`}
                      >
                        {cat.shortLabel}
                      </button>
                    ))}
                  </div>

                  {/* Status Filter Pills */}
                  {viewTab !== 'completed' && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-purple-400/10">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-200/55 mr-1">
                        Status:
                      </span>
                      {(
                        ['all', 'Not Started', 'In Progress', 'Completed', 'Locked'] as const
                      ).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setSelectedStatus(status)}
                          data-testid={`status-filter-${status.toLowerCase().replace(/\s+/g, '-')}`}
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                            selectedStatus === status
                              ? 'bg-[#FF1A6C]/25 border border-[#FF1A6C]/50 text-[#FF9AC0]'
                              : 'bg-[#190B32] border border-white/10 text-purple-200/70 hover:text-white'
                          }`}
                        >
                          {status === 'all' ? 'All Statuses' : status}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Task Results / Empty States */}
                {tasks.length === 0 ? (
                  <DailyTaskEmptyState
                    kind="no_tasks"
                    onAction={handleResetAllDemo}
                  />
                ) : viewTab === 'completed' ? (
                  searchQuery.trim() || selectedCategory !== 'all' ? (
                    filteredTasks.length === 0 ? (
                      <DailyTaskEmptyState
                        kind={searchQuery.trim() ? 'no_search_results' : 'no_category_tasks'}
                        searchQuery={searchQuery}
                        categoryLabel={activeCategoryLabel}
                        onAction={clearFilters}
                      />
                    ) : (
                      <CompletedTasksSection
                        tasks={filteredTasks}
                        onViewDetails={(id) => setSelectedTaskId(id)}
                        onResetTask={handleResetTask}
                        onSwitchToActive={() => setViewTab('active')}
                      />
                    )
                  ) : (
                    <CompletedTasksSection
                      tasks={filteredTasks}
                      onViewDetails={(id) => setSelectedTaskId(id)}
                      onResetTask={handleResetTask}
                      onSwitchToActive={() => setViewTab('active')}
                    />
                  )
                ) : viewTab === 'active' && summary.activeTasks === 0 ? (
                  <DailyTaskEmptyState
                    kind="no_active"
                    onAction={() => setViewTab('completed')}
                  />
                ) : filteredTasks.length === 0 ? (
                  <DailyTaskEmptyState
                    kind={searchQuery.trim() ? 'no_search_results' : 'no_category_tasks'}
                    searchQuery={searchQuery}
                    categoryLabel={activeCategoryLabel}
                    onAction={clearFilters}
                  />
                ) : (
                  <div data-testid="daily-tasks-list" className="space-y-3">
                    {filteredTasks.map((task) => (
                      <DailyTaskCard
                        key={task.id}
                        task={task}
                        onViewDetails={(id) => setSelectedTaskId(id)}
                        onIncrementProgress={handleIncrementProgress}
                        onMarkComplete={handleMarkComplete}
                        onUnlockPreview={handleUnlockPreview}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR (Desktop Summary & Info) */}
          <aside className="space-y-5 lg:sticky lg:top-24">
            <section
              data-testid="daily-tasks-category-breakdown"
              className="rounded-3xl bg-[#130728] border border-purple-400/20 p-5 space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-wider text-purple-200/75">
                  Category Overview
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/35 text-[10px] font-bold text-amber-300">
                  Sample Data
                </span>
              </div>

              <div className="space-y-2.5">
                {TASK_CATEGORY_OPTIONS.map((cat) => {
                  const counts = categoryCounts[cat.id];
                  const pct =
                    counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedTaskId(null);
                        setViewTab('all');
                        setSelectedCategory(cat.id);
                      }}
                      className="w-full text-left rounded-2xl bg-[#1A0B34] hover:bg-[#231045] border border-purple-400/15 p-3 space-y-2 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-white">{cat.label}</span>
                        <span className="text-[#FF85B3]">
                          {counts.done}/{counts.total}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[#2A154A] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#FF1A6C] to-amber-300 transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-1 flex flex-col gap-2">
                <Link
                  href="/earning-identity"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[#1C0D38] hover:bg-[#27134D] border border-amber-400/30 text-xs font-bold text-amber-200 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                  <span>Open Earning Identity</span>
                </Link>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  leftIcon={<RotateCcw className="w-3.5 h-3.5 text-[#FF6BA3]" />}
                  onClick={handleResetAllDemo}
                  data-testid="sidebar-reset-demo-btn"
                  className="w-full border-purple-400/25 bg-transparent hover:bg-white/5 text-xs whitespace-nowrap"
                >
                  Reset Sample Tasks
                </Button>
              </div>
            </section>

            {/* Sample Date & Policy Info Card */}
            <section className="rounded-3xl bg-[#130728] border border-purple-400/20 p-5 space-y-3 shadow-xl">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#FF6BA3]" />
                <h2 className="text-sm font-extrabold text-white">Task Date & Preview Rules</h2>
              </div>
              <p className="text-xs text-purple-200/75 leading-relaxed">
                Showing static sample date <strong className="text-white">{SAMPLE_TASK_DATE}</strong>. Daily resets, live room analytics, and financial rewards are not connected in this frontend phase.
              </p>
              <div className="rounded-2xl bg-[#190B34] border border-purple-400/20 p-3 flex items-start gap-2 text-[11px] text-purple-200/75">
                <Info className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <span>
                  Official host tasks and completion criteria remain subject to client approval before backend integration.
                </span>
              </div>
              <Link
                href="/help"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF85B3] hover:underline"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Need creator help? Visit Support ↗</span>
              </Link>
            </section>
          </aside>
        </div>

        {/* Inline Mobile Quick Nav Footer (never overlays form/task interactions) */}
        <footer className="lg:hidden mt-6 pt-4 border-t border-purple-400/20">
          <div className="grid grid-cols-5 gap-1 rounded-2xl bg-[#130728] border border-purple-400/20 p-2">
            {[
              { href: '/live', label: 'Home', icon: Home, active: false },
              { href: '/earnings?preview=demo', label: 'Earnings', icon: Coins, active: false },
              { href: '/daily-tasks', label: 'Tasks', icon: ListTodo, active: true },
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

      {/* Confirmation Toast */}
      {toast && (
        <div
          role="status"
          data-testid="daily-tasks-toast"
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
