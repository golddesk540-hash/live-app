'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bell,
  BookOpen,
  CheckCircle2,
  Heart,
  HelpCircle,
  Home,
  Info,
  ListTodo,
  MoreVertical,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  User,
  X,
} from 'lucide-react';
import { useUnreadNotificationsCount } from '@/components/notifications/useUnreadNotificationsCount';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LearningStepDetailView } from './LearningStepDetailView';
import { NewHostEmptyState } from './NewHostEmptyState';
import {
  CategoryGuideView,
  LearningProgressView,
  StarterPackDashboardView,
} from './StarterPackSections';
import { WelcomeHeroCard } from './WelcomeHeroCard';
import {
  INITIAL_COMPLETED_STEP_IDS,
  computePackProgress,
  createInitialLearningSteps,
} from './mockNewHostPackData';
import { GuideCategoryId, LearningStepItem, PackViewMode } from './types';

export const NewHostPackScreen: React.FC = () => {
  const unreadNotifications = useUnreadNotificationsCount();
  const [steps, setSteps] = useState<LearningStepItem[]>(createInitialLearningSteps);
  const [completedStepIds, setCompletedStepIds] = useState<string[]>(
    INITIAL_COMPLETED_STEP_IDS
  );
  const [viewMode, setViewMode] = useState<PackViewMode>('welcome');
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 2600);
  };

  const completedSet = useMemo(() => new Set(completedStepIds), [completedStepIds]);

  const progress = useMemo(
    () => computePackProgress(steps, completedStepIds),
    [steps, completedStepIds]
  );

  const selectedStepIndex = useMemo(
    () => steps.findIndex((s) => s.id === selectedStepId),
    [steps, selectedStepId]
  );
  const selectedStep = selectedStepIndex >= 0 ? steps[selectedStepIndex] : null;

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return steps.filter((s) => {
      const hay = `${s.title} ${s.shortDescription} ${s.categoryLabel}`.toLowerCase();
      return hay.includes(q);
    });
  }, [steps, searchQuery]);

  const handleToggleStepComplete = (stepId: string) => {
    const step = steps.find((s) => s.id === stepId);
    setCompletedStepIds((prev) => {
      const exists = prev.includes(stepId);
      if (exists) {
        if (step) showToast(`Marked as pending: ${step.title}`);
        return prev.filter((id) => id !== stepId);
      } else {
        if (step) showToast(`Completed onboarding step: ${step.title}`);
        return [...prev, stepId];
      }
    });
  };

  const handleOpenStep = (stepId: string) => {
    setSelectedStepId(stepId);
    setSearchQuery('');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleResetDemo = () => {
    setSteps(createInitialLearningSteps());
    setCompletedStepIds(INITIAL_COMPLETED_STEP_IDS);
    setViewMode('welcome');
    setSelectedStepId(null);
    setSearchQuery('');
    setShowOptionsMenu(false);
    showToast('Restored default New-Host Pack starter guides');
  };

  const handlePreviewEmptyContent = () => {
    setSteps([]);
    setSelectedStepId(null);
    setShowOptionsMenu(false);
    showToast('Previewing empty learning content state');
  };

  const handlePreviewZeroCompleted = () => {
    if (steps.length === 0) setSteps(createInitialLearningSteps());
    setCompletedStepIds([]);
    setSelectedStepId(null);
    setViewMode('progress');
    setShowOptionsMenu(false);
    showToast('Previewing zero completed steps');
  };

  const handlePreviewAllCompleted = () => {
    const allSteps = steps.length > 0 ? steps : createInitialLearningSteps();
    if (steps.length === 0) setSteps(allSteps);
    setCompletedStepIds(allSteps.map((s) => s.id));
    setSelectedStepId(null);
    setViewMode('progress');
    setShowOptionsMenu(false);
    showToast('Previewing all starter pack steps completed');
  };

  const viewTabs: { id: PackViewMode; label: string }[] = [
    { id: 'welcome', label: 'Welcome' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'profile_setup', label: 'Profile Setup' },
    { id: 'live_streaming', label: 'Live Guide' },
    { id: 'community_safety', label: 'Safety Guide' },
    { id: 'host_goals', label: 'Host Goals' },
    { id: 'progress', label: 'Progress' },
  ];

  return (
    <div
      data-testid="new-host-pack-screen"
      className="min-h-screen bg-[#0D031B] text-white flex flex-col pb-8 lg:pb-10"
    >
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 border-b border-purple-400/20 bg-[#120624]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (selectedStepId) {
                  setSelectedStepId(null);
                } else if (viewMode !== 'welcome') {
                  setViewMode('welcome');
                } else if (typeof window !== 'undefined' && window.history.length > 1) {
                  window.history.back();
                } else if (typeof window !== 'undefined') {
                  window.location.href = '/profile';
                }
              }}
              data-testid="new-host-back-btn"
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
                  Phase 9.4
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav aria-label="Creator Onboarding Navigation" className="hidden lg:flex items-center gap-1.5">
            {[
              { href: '/live', label: 'Home', active: false },
              { href: '/new-host-pack', label: 'New-Host Pack', active: true },
              { href: '/daily-tasks', label: 'Daily Host Tasks', active: false },
              { href: '/task-level', label: 'Task Level', active: false },
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

          {/* Right Header Icons */}
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
                data-testid="new-host-options-btn"
                aria-label="New-Host Pack Options"
                className="p-2 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-purple-100/85 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showOptionsMenu && (
                <div
                  data-testid="new-host-options-menu"
                  className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#180A31] border border-purple-400/25 shadow-2xl p-2 z-50 space-y-1"
                >
                  <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-200/60">
                    Onboarding Demo States
                  </p>
                  <button
                    type="button"
                    onClick={handleResetDemo}
                    data-testid="menu-reset-pack-default"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-purple-100 hover:bg-purple-500/20 flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#FF6BA3]" />
                    <span>Restore Starter Pack</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePreviewEmptyContent}
                    data-testid="menu-preview-empty-content"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-purple-500/20"
                  >
                    Preview No Content State
                  </button>
                  <button
                    type="button"
                    onClick={handlePreviewZeroCompleted}
                    data-testid="menu-preview-zero-completed-steps"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-purple-500/20"
                  >
                    Preview Zero Completed Steps
                  </button>
                  <button
                    type="button"
                    onClick={handlePreviewAllCompleted}
                    data-testid="menu-preview-all-completed-steps"
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-purple-500/20"
                  >
                    Preview All Steps Complete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-5 space-y-5">
        {/* Heading + Search */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              New-Host Pack
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/70 mt-1">
              A starter guide for new creators · Frontend preview only
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-purple-300/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (selectedStepId) setSelectedStepId(null);
              }}
              placeholder="Search onboarding guides..."
              aria-label="Search onboarding guides"
              data-testid="new-host-search-input"
              className="pl-8 pr-8 py-2 text-xs rounded-xl bg-[#190B32] border-purple-400/25"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                data-testid="new-host-search-clear"
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-purple-200/70 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Section Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {viewTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setSelectedStepId(null);
                setSearchQuery('');
                setViewMode(tab.id);
              }}
              data-testid={`pack-view-tab-${tab.id}`}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all ${
                viewMode === tab.id && !selectedStep && !searchQuery.trim()
                  ? 'bg-gradient-to-r from-[#FF1A6C] to-[#EC4899] text-white shadow-glow-pink'
                  : 'bg-[#190B33] text-purple-200/75 border border-purple-400/20 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Two-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
          {/* LEFT / PRIMARY CONTENT */}
          <div className="space-y-5 min-w-0">
            {steps.length === 0 ? (
              <NewHostEmptyState kind="no_content" onAction={handleResetDemo} />
            ) : searchQuery.trim() ? (
              <section data-testid="new-host-search-results" className="space-y-3">
                <p className="text-xs font-bold text-purple-200/75">
                  Search results for &ldquo;{searchQuery.trim()}&rdquo; ({searchResults.length})
                </p>
                {searchResults.length === 0 ? (
                  <NewHostEmptyState
                    kind="no_search_results"
                    searchQuery={searchQuery.trim()}
                    onAction={() => setSearchQuery('')}
                  />
                ) : (
                  <div className="space-y-2.5">
                    {searchResults.map((step) => {
                      const done = completedSet.has(step.id);
                      return (
                        <div
                          key={step.id}
                          className="rounded-2xl bg-[#130728] border border-purple-400/20 p-4 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-amber-300">
                              {step.categoryLabel} · {done ? 'Completed' : 'Pending'}
                            </p>
                            <h3 className="text-sm font-extrabold text-white truncate">
                              {step.title}
                            </h3>
                            <p className="text-xs text-purple-200/70 truncate">
                              {step.shortDescription}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="xs"
                            variant="outline"
                            onClick={() => handleOpenStep(step.id)}
                            className="border-purple-400/30 bg-[#1B0C36] whitespace-nowrap"
                          >
                            Open Step
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            ) : selectedStep ? (
              <LearningStepDetailView
                step={selectedStep}
                isCompleted={completedSet.has(selectedStep.id)}
                hasPrevious={selectedStepIndex > 0}
                hasNext={selectedStepIndex < steps.length - 1}
                totalSteps={steps.length}
                onBack={() => setSelectedStepId(null)}
                onToggleComplete={handleToggleStepComplete}
                onPreviousStep={() => {
                  if (selectedStepIndex > 0) {
                    setSelectedStepId(steps[selectedStepIndex - 1].id);
                  }
                }}
                onNextStep={() => {
                  if (selectedStepIndex < steps.length - 1) {
                    setSelectedStepId(steps[selectedStepIndex + 1].id);
                  }
                }}
              />
            ) : viewMode === 'welcome' ? (
              <div className="space-y-6">
                <WelcomeHeroCard
                  progress={progress}
                  onGetStarted={() => setViewMode('dashboard')}
                  onOpenProgress={() => setViewMode('progress')}
                />
                <StarterPackDashboardView
                  progress={progress}
                  onSelectCategory={(cat: GuideCategoryId) => setViewMode(cat)}
                  onContinueLearning={handleOpenStep}
                />
              </div>
            ) : viewMode === 'dashboard' ? (
              <StarterPackDashboardView
                progress={progress}
                onSelectCategory={(cat: GuideCategoryId) => setViewMode(cat)}
                onContinueLearning={handleOpenStep}
              />
            ) : viewMode === 'progress' ? (
              <LearningProgressView
                steps={steps}
                completedSet={completedSet}
                progress={progress}
                onOpenStep={handleOpenStep}
                onExploreDashboard={() => setViewMode('dashboard')}
                onResetDemo={handleResetDemo}
              />
            ) : (
              <CategoryGuideView
                categoryId={viewMode}
                steps={steps.filter((s) => s.category === viewMode)}
                completedSet={completedSet}
                onOpenStep={handleOpenStep}
                onToggleComplete={handleToggleStepComplete}
              />
            )}
          </div>

          {/* RIGHT SIDEBAR (Progress Summary + Help & Support) */}
          <aside className="space-y-5 lg:sticky lg:top-24">
            <section
              data-testid="new-host-pack-sidebar"
              className="rounded-3xl bg-[#130728] border border-purple-400/20 p-5 space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-wider text-purple-200/75">
                  Starter Progress
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/35 text-[10px] font-bold text-amber-300">
                  {progress.overallPercent}%
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-purple-400/15">
                  <span className="text-purple-200/70">Steps Completed</span>
                  <span className="font-bold text-emerald-300">
                    {progress.completedCount} / {progress.totalSteps}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-purple-200/70">Pending Steps</span>
                  <span className="font-bold text-white">{progress.pendingCount}</span>
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
                <Link
                  href="/task-level"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[#1C0D38] hover:bg-[#27134D] border border-amber-400/30 text-xs font-bold text-amber-200 transition-colors"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-300" />
                  <span>Open Task Level</span>
                </Link>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  leftIcon={<RotateCcw className="w-3.5 h-3.5 text-[#FF6BA3]" />}
                  onClick={handleResetDemo}
                  data-testid="sidebar-reset-pack-btn"
                  className="w-full border-purple-400/25 bg-transparent hover:bg-white/5 text-xs whitespace-nowrap"
                >
                  Reset Onboarding Demo
                </Button>
              </div>
            </section>

            <section className="rounded-3xl bg-[#130728] border border-purple-400/20 p-5 space-y-3 shadow-xl">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#FF6BA3]" />
                <h2 className="text-sm font-extrabold text-white">Help &amp; Support</h2>
              </div>
              <p className="text-xs text-purple-200/75 leading-relaxed">
                This New-Host Pack connects directly to Popo Live profile, safety, and host goal modules for interactive frontend exploration.
              </p>
              <div className="rounded-2xl bg-[#190B34] border border-purple-400/20 p-3 flex items-start gap-2 text-[11px] text-purple-200/75">
                <Info className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <span>
                  Guide completion stays in local session state without inventing official payout policies or launching real broadcasts.
                </span>
              </div>
              <div className="flex flex-wrap gap-3 pt-1">
                <Link
                  href="/help"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF85B3] hover:underline"
                >
                  <span>Support Center ↗</span>
                </Link>
                <Link
                  href="/safety"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-200 hover:underline"
                >
                  <span>Safety Tools ↗</span>
                </Link>
              </div>
            </section>
          </aside>
        </div>

        {/* Inline Mobile Footer Quick Nav */}
        <footer className="lg:hidden mt-6 pt-4 border-t border-purple-400/20">
          <div className="grid grid-cols-5 gap-1 rounded-2xl bg-[#130728] border border-purple-400/20 p-2">
            {[
              { href: '/live', label: 'Home', icon: Home, active: false },
              { href: '/new-host-pack', label: 'Starter', icon: BookOpen, active: true },
              { href: '/daily-tasks', label: 'Tasks', icon: ListTodo, active: false },
              { href: '/task-level', label: 'Level', icon: Trophy, active: false },
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

      {/* Toast Feedback */}
      {toast && (
        <div
          role="status"
          data-testid="new-host-pack-toast"
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
