'use client';

import React from 'react';
import { ArrowLeft, CheckCircle2, Info, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { renderLevelIcon } from './LevelCardList';
import { LEVEL_STATUS_STYLES } from './mockTaskLevelData';
import { ComputedTaskLevelItem, TaskLevelBenefit } from './types';

interface LevelDetailViewProps {
  level: ComputedTaskLevelItem;
  currentPoints: number;
  benefits: TaskLevelBenefit[];
  onBack: () => void;
  onJumpDemoToLevel: (targetPoints: number) => void;
}

export const LevelDetailView: React.FC<LevelDetailViewProps> = ({
  level,
  currentPoints,
  benefits,
  onBack,
  onJumpDemoToLevel,
}) => {
  const style = LEVEL_STATUS_STYLES[level.status];
  const levelBenefits = benefits.filter(
    (b) => b.associatedLevelNumber === level.levelNumber
  );

  return (
    <section
      data-testid="task-level-detail-view"
      className="rounded-3xl bg-[#130728] border border-purple-400/25 p-5 sm:p-6 space-y-5 shadow-2xl"
    >
      {/* Back Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          data-testid="level-detail-back-btn"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1E0D3D] hover:bg-[#2B1554] border border-purple-400/25 text-xs font-bold text-purple-100 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Task Level</span>
        </button>

        <span
          data-testid="level-detail-status-badge"
          className={`px-3 py-1 rounded-full border text-xs font-extrabold ${style.badgeClasses}`}
        >
          {level.status}
        </span>
      </div>

      {/* Level Identity */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#1F0D3F] border border-amber-400/35 flex items-center justify-center text-amber-300 shrink-0">
          {renderLevelIcon(level.iconKey, 'w-7 h-7')}
        </div>

        <div className="space-y-1 min-w-0">
          <p className="text-xs font-black uppercase tracking-wider text-amber-300">
            {level.levelCode}
          </p>
          <h2 className="text-xl sm:text-2xl font-black text-white">{level.name}</h2>
          <p className="text-xs sm:text-sm text-purple-200/75 leading-relaxed">
            {level.description}
          </p>
        </div>
      </div>

      {/* Progress Breakdown */}
      <div className="rounded-2xl bg-[#1A0C34] border border-purple-400/20 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-purple-200/65">
              Required Sample Threshold
            </p>
            <p className="text-lg font-black text-white mt-0.5">
              {level.targetPoints.toLocaleString()} points
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold uppercase tracking-wider text-purple-200/65">
              Your Demo Progress
            </p>
            <p className="text-lg font-black text-amber-300 mt-0.5">
              {currentPoints.toLocaleString()} / {level.targetPoints.toLocaleString()} (
              {level.progressPercent}%)
            </p>
          </div>
        </div>

        <div className="h-3 w-full rounded-full bg-[#2A154A] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${style.progressBarClasses}`}
            style={{ width: `${level.progressPercent}%` }}
          />
        </div>

        <p className="text-xs text-purple-200/70">
          {level.remainingPoints === 0
            ? 'Sample point threshold has been achieved in this frontend session.'
            : `${level.remainingPoints.toLocaleString()} remaining demo points to complete ${level.levelCode}.`}
        </p>
      </div>

      {/* Milestones */}
      <div className="space-y-2.5">
        <h3 className="text-sm font-extrabold text-white">Level Information Notes</h3>
        <ul className="space-y-2">
          {level.sampleMilestones.map((note, idx) => (
            <li
              key={idx}
              className="rounded-2xl bg-[#180A30] border border-purple-400/15 px-3.5 py-2.5 text-xs text-purple-100/85 flex items-start gap-2.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FF6BA3] shrink-0 mt-0.5" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Associated Placeholder Benefits */}
      <div className="space-y-2.5">
        <h3 className="text-sm font-extrabold text-white">
          Associated Placeholder Benefits
        </h3>
        {levelBenefits.length === 0 ? (
          <p className="text-xs text-purple-200/65">
            No sample benefits configured for this tier.
          </p>
        ) : (
          <div className="space-y-2">
            {levelBenefits.map((benefit) => {
              const unlocked = level.status === 'Completed' || level.status === 'Current';
              return (
                <div
                  key={benefit.id}
                  className="rounded-2xl bg-[#190B34] border border-purple-400/20 px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-extrabold text-white">{benefit.title}</p>
                    <p className="text-[11px] text-purple-200/70">
                      {benefit.description}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold shrink-0 inline-flex items-center gap-1 ${
                      unlocked
                        ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                        : 'bg-white/5 border-white/15 text-purple-200/60'
                    }`}
                  >
                    {unlocked ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <Lock className="w-3 h-3" />
                    )}
                    <span>{unlocked ? 'Available (Demo)' : 'Locked'}</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-[#180B32] border border-amber-400/25 px-3.5 py-2.5 text-[11px] text-purple-100/80 flex items-start gap-2">
        <Info className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
        <span>
          <strong className="text-amber-300">Sample Level Rules Only:</strong> Point requirements and tier descriptions are frontend testing examples and do not grant financial benefits or cash rewards.
        </span>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          variant="primary"
          leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          onClick={() => onJumpDemoToLevel(level.targetPoints)}
          data-testid="level-detail-simulate-reach-btn"
          className="whitespace-nowrap"
        >
          Preview At {level.targetPoints.toLocaleString()} Demo Pts
        </Button>
      </div>
    </section>
  );
};
