'use client';

import React from 'react';
import { Check, FileCheck2, FileText, ShieldCheck, UserCheck } from 'lucide-react';
import { IdentityStepId, IdentityViewMode } from './types';

interface VerificationProgressTrackerProps {
  activeView: IdentityViewMode;
  personalCompleted: boolean;
  documentsCompleted: boolean;
  submissionCompleted: boolean;
  onSelectStep: (step: IdentityStepId) => void;
}

export const VerificationProgressTracker: React.FC<VerificationProgressTrackerProps> = ({
  activeView,
  personalCompleted,
  documentsCompleted,
  submissionCompleted,
  onSelectStep,
}) => {
  const steps: {
    id: IdentityStepId;
    stepNum: number;
    label: string;
    shortDesc: string;
    completed: boolean;
    Icon: React.ElementType;
  }[] = [
    {
      id: 'personal',
      stepNum: 1,
      label: 'Personal Information',
      shortDesc: 'Name, country, DOB',
      completed: personalCompleted,
      Icon: UserCheck,
    },
    {
      id: 'documents',
      stepNum: 2,
      label: 'Document Information',
      shortDesc: 'Local front & back previews',
      completed: documentsCompleted,
      Icon: FileText,
    },
    {
      id: 'review',
      stepNum: 3,
      label: 'Review Details',
      shortDesc: 'Masked summary & confirm',
      completed: submissionCompleted,
      Icon: FileCheck2,
    },
    {
      id: 'status',
      stepNum: 4,
      label: 'Submission Status',
      shortDesc: 'Frontend display status',
      completed: submissionCompleted,
      Icon: ShieldCheck,
    },
  ];

  const completedCount = [
    personalCompleted,
    documentsCompleted,
    submissionCompleted,
    submissionCompleted,
  ].filter(Boolean).length;

  return (
    <section
      data-testid="identity-progress-tracker"
      className="rounded-3xl bg-[#130728]/95 border border-purple-400/20 p-4 sm:p-5 space-y-4 shadow-xl"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-sm sm:text-base font-black text-white">Verification Progress</h2>
          <p className="text-[11px] text-purple-200/65">
            Tap any editable step to navigate and preview locally
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-[#1F0E3D] border border-purple-400/25 text-[11px] font-extrabold text-amber-300">
          {completedCount} of 4 steps ready
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 rounded-full bg-[#241046] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#FF1A6C] via-[#EC4899] to-amber-400 transition-all duration-300"
          style={{ width: `${Math.max(12, Math.round((completedCount / 4) * 100))}%` }}
        />
      </div>

      {/* Interactive 4-Step Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
        {steps.map((step) => {
          const isCurrent = activeView === step.id;
          const Icon = step.Icon;
          const stateLabel = step.completed ? 'Completed' : isCurrent ? 'Current' : 'Pending';

          return (
            <button
              key={step.id}
              type="button"
              data-testid={`progress-step-${step.id}`}
              onClick={() => onSelectStep(step.id)}
              className={`text-left p-2.5 sm:p-3 rounded-2xl border transition-all flex items-start gap-2.5 sm:gap-3 ${
                isCurrent
                  ? 'bg-[#260E4B] border-[#FF1A6C] shadow-glow-pink'
                  : step.completed
                  ? 'bg-[#170933] border-emerald-400/35 hover:border-emerald-300/60'
                  : 'bg-[#170933]/80 border-white/10 hover:border-purple-400/40'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-black ${
                  step.completed
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    : isCurrent
                    ? 'bg-[#FF1A6C] text-white'
                    : 'bg-[#251149] text-purple-200/75 border border-white/10'
                }`}
              >
                {step.completed ? <Check className="w-4 h-4" /> : step.stepNum}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-xs font-extrabold text-white truncate">{step.label}</span>
                </div>
                <p className="text-[11px] text-purple-200/60 truncate mt-0.5">{step.shortDesc}</p>
                <span
                  className={`inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold ${
                    step.completed
                      ? 'text-emerald-300'
                      : isCurrent
                      ? 'text-[#FF6BA3]'
                      : 'text-purple-200/45'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{stateLabel}</span>
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
