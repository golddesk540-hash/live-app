'use client';

import React from 'react';
import { Award, CheckCircle2, Crown, Info, Lock, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { TaskLevelEmptyState } from './TaskLevelEmptyState';
import { TaskLevelBenefit } from './types';

function renderBenefitIcon(iconKey: TaskLevelBenefit['iconKey']) {
  switch (iconKey) {
    case 'award':
      return <Award className="w-5 h-5" />;
    case 'shield':
      return <ShieldCheck className="w-5 h-5" />;
    case 'sparkles':
      return <Sparkles className="w-5 h-5" />;
    case 'users':
      return <Users className="w-5 h-5" />;
    case 'crown':
    default:
      return <Crown className="w-5 h-5" />;
  }
}

interface LevelBenefitsSectionProps {
  benefits: TaskLevelBenefit[];
  currentLevelNumber: number;
  onRestoreBenefits?: () => void;
}

export const LevelBenefitsSection: React.FC<LevelBenefitsSectionProps> = ({
  benefits,
  currentLevelNumber,
  onRestoreBenefits,
}) => {
  if (benefits.length === 0) {
    return (
      <TaskLevelEmptyState
        kind="no_benefits"
        onAction={onRestoreBenefits || (() => {})}
      />
    );
  }

  return (
    <section data-testid="level-benefits-section" className="space-y-4">
      <div className="rounded-2xl bg-[#180A32] border border-amber-400/25 px-4 py-3 flex items-start gap-2.5 text-xs text-purple-100/85">
        <Info className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
        <span>
          <strong className="text-amber-300">Demo Display Only:</strong> Sample profile frames and visual labels below are UI placeholders. Official earning rates, commissions, and withdrawal rules require approved backend policies.
        </span>
      </div>

      <div className="space-y-3">
        {benefits.map((benefit) => {
          const isAvailable = benefit.associatedLevelNumber <= currentLevelNumber;
          return (
            <article
              key={benefit.id}
              data-testid={`level-benefit-card-${benefit.id}`}
              className={`rounded-3xl bg-[#130728] border p-4 sm:p-5 flex items-start justify-between gap-3 transition-all ${
                isAvailable
                  ? 'border-emerald-400/30 shadow-lg'
                  : 'border-white/10 opacity-85'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                    isAvailable
                      ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                      : 'bg-[#1D0C3A] border-purple-400/20 text-purple-300/60'
                  }`}
                >
                  {renderBenefitIcon(benefit.iconKey)}
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-400/25 text-[10px] font-bold text-purple-200">
                      {benefit.associatedLevelLabel}
                    </span>
                    <span
                      data-testid={`benefit-status-${benefit.id}`}
                      className={`px-2 py-0.5 rounded-full border text-[10px] font-extrabold ${
                        isAvailable
                          ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                          : 'bg-white/5 border-white/15 text-purple-200/60'
                      }`}
                    >
                      {isAvailable ? 'Available (Demo)' : 'Locked'}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-extrabold text-white">
                    {benefit.title}
                  </h3>
                  <p className="text-xs text-purple-200/75 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>

              <div className="pt-1 shrink-0">
                {isAvailable ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Lock className="w-4 h-4 text-purple-300/50" />
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
