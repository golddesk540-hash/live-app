'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  ExternalLink,
  Layers,
  ListChecks,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { renderPackStepIcon } from './LearningStepDetailView';
import { NewHostEmptyState } from './NewHostEmptyState';
import { getCategoryMeta } from './mockNewHostPackData';
import {
  GuideCategoryId,
  LearningStepItem,
  PackProgressSummary,
} from './types';

interface StarterPackDashboardViewProps {
  progress: PackProgressSummary;
  onSelectCategory: (category: GuideCategoryId) => void;
  onContinueLearning: (stepId: string) => void;
}

export const StarterPackDashboardView: React.FC<StarterPackDashboardViewProps> = ({
  progress,
  onSelectCategory,
  onContinueLearning,
}) => {
  return (
    <div data-testid="starter-pack-dashboard" className="space-y-5">
      {/* 4 Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          data-testid="pack-stat-total"
          className="rounded-2xl bg-[#130728] border border-purple-400/20 p-3.5 space-y-1"
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-purple-200/70">
            <span>Total Steps</span>
            <Layers className="w-3.5 h-3.5 text-purple-300" />
          </div>
          <p className="text-xl font-black text-white">{progress.totalSteps}</p>
        </div>

        <div
          data-testid="pack-stat-completed"
          className="rounded-2xl bg-[#130728] border border-emerald-400/25 p-3.5 space-y-1"
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300">
            <span>Completed</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <p className="text-xl font-black text-emerald-300">{progress.completedCount}</p>
        </div>

        <div
          data-testid="pack-stat-remaining"
          className="rounded-2xl bg-[#130728] border border-purple-400/20 p-3.5 space-y-1"
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-purple-200/70">
            <span>Remaining</span>
            <ListChecks className="w-3.5 h-3.5 text-purple-300" />
          </div>
          <p className="text-xl font-black text-white">{progress.pendingCount}</p>
        </div>

        <div
          data-testid="pack-stat-percent"
          className="rounded-2xl bg-[#130728] border border-[#FF1A6C]/30 p-3.5 space-y-1"
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-[#FF85B3]">
            <span>Progress</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <p className="text-xl font-black text-[#FF85B3]">{progress.overallPercent}%</p>
        </div>
      </div>

      {/* Recommended Next Step */}
      {progress.recommendedNextStep && (
        <section
          data-testid="recommended-next-step-card"
          className="rounded-3xl bg-gradient-to-r from-[#1D0B3B] to-[#130728] border border-[#FF1A6C]/35 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl"
        >
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[#FF1A6C]/20 border border-[#FF1A6C]/40 flex items-center justify-center text-[#FF6BA3] shrink-0">
              {renderPackStepIcon(progress.recommendedNextStep.iconKey)}
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                Recommended Next Step · {progress.recommendedNextStep.categoryLabel}
              </p>
              <h3 className="text-base font-extrabold text-white truncate">
                {progress.recommendedNextStep.title}
              </h3>
              <p className="text-xs text-purple-200/75 line-clamp-2">
                {progress.recommendedNextStep.shortDescription}
              </p>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            variant="primary"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            onClick={() => onContinueLearning(progress.recommendedNextStep!.id)}
            data-testid="continue-learning-btn"
            className="whitespace-nowrap shrink-0 self-start sm:self-center"
          >
            Continue Learning
          </Button>
        </section>
      )}

      {/* "Your starter guide" 4 Cards matching 09_04_new_host_pack.png */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-black text-white">Your starter guide</h2>
          <span className="text-xs text-purple-200/65">4 Learning Guides</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {progress.categories.map(({ category, total, completed, percent }) => (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelectCategory(category.id)}
              data-testid={`starter-guide-card-${category.id}`}
              className="text-left rounded-3xl bg-[#130728] hover:bg-[#1B0A38] border border-purple-400/20 hover:border-[#FF1A6C]/45 p-5 space-y-3.5 transition-all shadow-lg group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-[#1F0D3F] border border-purple-400/25 flex items-center justify-center text-[#FF6BA3] shrink-0">
                    {renderPackStepIcon(category.iconKey)}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <h3 className="text-sm sm:text-base font-extrabold text-white group-hover:text-[#FF85B3] transition-colors">
                      {category.cardTitle}
                    </h3>
                    <p className="text-xs text-purple-200/70">{category.cardSubtitle}</p>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-purple-300/60 group-hover:text-[#FF6BA3] shrink-0 mt-1 transition-colors" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-purple-200/70">
                    {completed} of {total} steps
                  </span>
                  <span className="text-amber-300">{percent}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#241242] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#FF1A6C] to-amber-300 transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

interface CategoryGuideViewProps {
  categoryId: GuideCategoryId;
  steps: LearningStepItem[];
  completedSet: Set<string>;
  onOpenStep: (stepId: string) => void;
  onToggleComplete: (stepId: string) => void;
}

export const CategoryGuideView: React.FC<CategoryGuideViewProps> = ({
  categoryId,
  steps,
  completedSet,
  onOpenStep,
  onToggleComplete,
}) => {
  const meta = getCategoryMeta(categoryId);
  const completedCount = steps.filter((s) => completedSet.has(s.id)).length;
  const percent = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  return (
    <section data-testid={`category-guide-view-${categoryId}`} className="space-y-4">
      {/* Category Banner */}
      <div className="rounded-3xl bg-[#130728] border border-purple-400/25 p-5 space-y-3 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#1F0D3F] border border-purple-400/30 flex items-center justify-center text-amber-300 shrink-0">
              {renderPackStepIcon(meta.iconKey)}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">{meta.sectionTitle}</h2>
              <p className="text-xs sm:text-sm text-purple-200/75 mt-0.5">
                {meta.sectionDescription}
              </p>
            </div>
          </div>

          <Link
            href={meta.primaryRouteHref}
            data-testid={`category-primary-link-${categoryId}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#24114A] hover:bg-[#321766] border border-purple-400/35 text-xs font-bold text-white transition-colors whitespace-nowrap"
          >
            <span>{meta.primaryRouteLabel}</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#FF6BA3]" />
          </Link>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-purple-200/75">
              {completedCount} of {steps.length} guide steps complete
            </span>
            <span className="text-[#FF85B3]">{percent}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-[#241242] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FF1A6C] to-amber-300 transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Host Goals Quick Links to Modules 9.1, 9.2, 9.3 */}
      {categoryId === 'host_goals' && (
        <div className="rounded-3xl bg-[#160830] border border-amber-400/25 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-purple-100/85">
            <strong className="text-amber-300">Connected Goal Modules:</strong> Explore live frontend dashboards for host tasks & progression directly.
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/daily-tasks"
              className="px-3 py-1.5 rounded-full bg-[#FF1A6C]/20 border border-[#FF1A6C]/45 text-xs font-bold text-[#FF85B3] hover:bg-[#FF1A6C]/30 transition-colors"
            >
              Daily Host Tasks ↗
            </Link>
            <Link
              href="/task-level"
              className="px-3 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-xs font-bold text-amber-300 hover:bg-amber-400/25 transition-colors"
            >
              Task Level ↗
            </Link>
          </div>
        </div>
      )}

      {/* Steps List */}
      <div className="space-y-3">
        {steps.map((step) => {
          const isDone = completedSet.has(step.id);
          return (
            <article
              key={step.id}
              data-testid={`pack-step-card-${step.id}`}
              className={`rounded-3xl bg-[#130728] border p-4 sm:p-5 transition-all space-y-3 shadow-lg ${
                isDone ? 'border-emerald-400/30' : 'border-purple-400/20 hover:border-[#FF1A6C]/45'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                      isDone
                        ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                        : 'bg-[#1F0D3F] border-purple-400/25 text-[#FF6BA3]'
                    }`}
                  >
                    {renderPackStepIcon(step.iconKey)}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-extrabold ${
                        isDone
                          ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                          : 'bg-[#FF1A6C]/20 border-[#FF1A6C]/40 text-[#FF85B3]'
                      }`}
                    >
                      {isDone ? 'Completed' : 'Pending'}
                    </span>
                    <h3 className="text-sm sm:text-base font-extrabold text-white">
                      {step.title}
                    </h3>
                    <p className="text-xs text-purple-200/75 leading-relaxed">
                      {step.shortDescription}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleComplete(step.id)}
                  aria-label={isDone ? 'Mark step pending' : 'Mark step complete'}
                  className="pt-1 shrink-0"
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-purple-300/45 hover:text-[#FF6BA3]" />
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-purple-400/15">
                <Link
                  href={step.relatedRouteHref}
                  className="text-xs font-bold text-amber-300 hover:underline inline-flex items-center gap-1"
                >
                  <span>{step.relatedRouteLabel}</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  leftIcon={<BookOpen className="w-3.5 h-3.5 text-[#FF6BA3]" />}
                  onClick={() => onOpenStep(step.id)}
                  data-testid={`open-step-btn-${step.id}`}
                  className="border-purple-400/30 bg-[#1B0C36] hover:bg-[#281350] text-xs whitespace-nowrap"
                >
                  Open Step
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

interface LearningProgressViewProps {
  steps: LearningStepItem[];
  completedSet: Set<string>;
  progress: PackProgressSummary;
  onOpenStep: (stepId: string) => void;
  onExploreDashboard: () => void;
  onResetDemo: () => void;
}

export const LearningProgressView: React.FC<LearningProgressViewProps> = ({
  steps,
  completedSet,
  progress,
  onOpenStep,
  onExploreDashboard,
  onResetDemo,
}) => {
  const [statusFilter, setStatusFilter] = useState<'completed' | 'pending'>('pending');

  const completedSteps = steps.filter((s) => completedSet.has(s.id));
  const pendingSteps = steps.filter((s) => !completedSet.has(s.id));
  const visibleList = statusFilter === 'completed' ? completedSteps : pendingSteps;

  return (
    <section data-testid="learning-progress-view" className="space-y-5">
      {/* Overall Completion Summary Card */}
      <div className="rounded-3xl bg-[#130728] border border-purple-400/25 p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-white">Learning Progress</h2>
            <p className="text-xs text-purple-200/70 mt-0.5">
              {progress.completedCount} completed · {progress.pendingCount} pending across 4 guides
            </p>
          </div>
          {progress.recommendedNextStep && (
            <Button
              type="button"
              size="sm"
              variant="primary"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={() => onOpenStep(progress.recommendedNextStep!.id)}
              data-testid="progress-continue-learning-btn"
              className="whitespace-nowrap"
            >
              Continue Learning
            </Button>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-purple-100/90">Overall Starter Pack Completion</span>
            <span className="text-[#FF85B3]">{progress.overallPercent}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-[#241242] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FF1A6C] to-amber-300 transition-all duration-300"
              style={{ width: `${progress.overallPercent}%` }}
            />
          </div>
        </div>

        {/* Category Progress Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {progress.categories.map(({ category, total, completed, percent }) => (
            <div
              key={category.id}
              className="rounded-2xl bg-[#1A0B34] border border-purple-400/15 p-3 space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-white">{category.sectionTitle}</span>
                <span className="text-amber-300">
                  {completed}/{total} ({percent}%)
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[#28134A] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#FF1A6C] to-amber-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending vs Completed Filter */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter('pending')}
          data-testid="progress-tab-pending"
          className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all ${
            statusFilter === 'pending'
              ? 'bg-gradient-to-r from-[#FF1A6C] to-[#EC4899] text-white shadow-glow-pink'
              : 'bg-[#190B32] border border-purple-400/20 text-purple-200/75 hover:text-white'
          }`}
        >
          Pending Steps ({pendingSteps.length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('completed')}
          data-testid="progress-tab-completed"
          className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all ${
            statusFilter === 'completed'
              ? 'bg-gradient-to-r from-emerald-500 to-amber-400 text-[#0D031B]'
              : 'bg-[#190B32] border border-purple-400/20 text-purple-200/75 hover:text-white'
          }`}
        >
          Completed Steps ({completedSteps.length})
        </button>
      </div>

      {visibleList.length === 0 ? (
        statusFilter === 'completed' ? (
          <NewHostEmptyState kind="no_completed" onAction={onExploreDashboard} />
        ) : (
          <NewHostEmptyState kind="no_pending" onAction={onResetDemo} />
        )
      ) : (
        <div className="space-y-2.5">
          {visibleList.map((step) => {
            const done = completedSet.has(step.id);
            return (
              <div
                key={step.id}
                data-testid={`progress-step-row-${step.id}`}
                className="rounded-2xl bg-[#130728] border border-purple-400/20 px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-[#FF6BA3] shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-extrabold text-white truncate">
                      {step.title}
                    </p>
                    <p className="text-[11px] text-purple-200/65 truncate">
                      {step.categoryLabel}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => onOpenStep(step.id)}
                  className="border-purple-400/30 bg-[#1B0C36] hover:bg-[#281350] whitespace-nowrap"
                >
                  Open Step
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
