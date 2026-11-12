'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Flag,
  HeartHandshake,
  HelpCircle,
  ListTodo,
  Lock,
  MessageSquareHeart,
  Radio,
  RotateCcw,
  ShieldCheck,
  Sliders,
  Sparkles,
  Trophy,
  UserCheck,
  Users,
  Video,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LearningStepItem, PackStepIconKey } from './types';

export function renderPackStepIcon(iconKey: PackStepIconKey, className = 'w-5 h-5') {
  switch (iconKey) {
    case 'camera':
      return <Camera className={className} />;
    case 'user_check':
      return <UserCheck className={className} />;
    case 'file_text':
      return <FileText className={className} />;
    case 'clipboard':
      return <ClipboardCheck className={className} />;
    case 'eye':
      return <Eye className={className} />;
    case 'video':
      return <Video className={className} />;
    case 'radio':
      return <Radio className={className} />;
    case 'sliders':
      return <Sliders className={className} />;
    case 'message':
      return <MessageSquareHeart className={className} />;
    case 'users':
      return <Users className={className} />;
    case 'shield':
      return <ShieldCheck className={className} />;
    case 'heart_handshake':
      return <HeartHandshake className={className} />;
    case 'flag':
      return <Flag className={className} />;
    case 'lock':
      return <Lock className={className} />;
    case 'list_todo':
      return <ListTodo className={className} />;
    case 'trophy':
      return <Trophy className={className} />;
    case 'help':
      return <HelpCircle className={className} />;
    case 'sparkles':
    default:
      return <Sparkles className={className} />;
  }
}

interface LearningStepDetailViewProps {
  step: LearningStepItem;
  isCompleted: boolean;
  hasPrevious: boolean;
  hasNext: boolean;
  totalSteps: number;
  onBack: () => void;
  onToggleComplete: (stepId: string) => void;
  onPreviousStep: () => void;
  onNextStep: () => void;
}

export const LearningStepDetailView: React.FC<LearningStepDetailViewProps> = ({
  step,
  isCompleted,
  hasPrevious,
  hasNext,
  totalSteps,
  onBack,
  onToggleComplete,
  onPreviousStep,
  onNextStep,
}) => {
  return (
    <section
      data-testid="new-host-step-detail-view"
      className="rounded-3xl bg-[#130728] border border-purple-400/25 p-5 sm:p-6 space-y-5 shadow-2xl"
    >
      {/* Top Bar: Back + Category + Status */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          data-testid="step-detail-back-btn"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1E0D3D] hover:bg-[#2B1554] border border-purple-400/25 text-xs font-bold text-purple-100 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Guide</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-400/25 text-[11px] font-bold text-purple-200">
            Step {step.orderIndex} of {totalSteps}
          </span>
          <span
            data-testid="step-detail-status-badge"
            className={`px-2.5 py-1 rounded-full border text-[11px] font-extrabold ${
              isCompleted
                ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                : 'bg-[#FF1A6C]/20 border-[#FF1A6C]/45 text-[#FF85B3]'
            }`}
          >
            {isCompleted ? 'Completed' : 'Pending'}
          </span>
        </div>
      </div>

      {/* Step Heading */}
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
            isCompleted
              ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
              : 'bg-[#1F0D3F] border-purple-400/30 text-[#FF6BA3]'
          }`}
        >
          {renderPackStepIcon(step.iconKey, 'w-6 h-6')}
        </div>

        <div className="space-y-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
            {step.categoryLabel}
          </p>
          <h2 className="text-lg sm:text-xl font-black text-white leading-snug">
            {step.title}
          </h2>
          <p className="text-xs sm:text-sm text-purple-200/75 leading-relaxed">
            {step.shortDescription}
          </p>
        </div>
      </div>

      {/* Instruction Content */}
      <div className="space-y-2.5">
        <h3 className="text-sm font-extrabold text-white">Guide Instructions</h3>
        <ul className="space-y-2">
          {step.instructionContent.map((line, idx) => (
            <li
              key={idx}
              className="rounded-2xl bg-[#180A30] border border-purple-400/15 px-3.5 py-3 text-xs sm:text-sm text-purple-100/85 flex items-start gap-2.5"
            >
              <span className="w-5 h-5 rounded-full bg-[#FF1A6C]/20 border border-[#FF1A6C]/40 text-[#FF85B3] text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span className="leading-relaxed">{line}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Connected Popo Live Screen Action */}
      <div className="rounded-2xl bg-[#190B34] border border-purple-400/25 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-xs font-extrabold text-white">Connected Creator Screen</p>
          <p className="text-[11px] text-purple-200/70">
            Navigate directly to the existing Popo Live module without leaving the platform.
          </p>
        </div>
        <Link
          href={step.relatedRouteHref}
          data-testid={`step-detail-route-link-${step.id}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#24114A] hover:bg-[#321766] border border-purple-400/35 text-xs font-bold text-white transition-colors whitespace-nowrap"
        >
          <span>{step.relatedRouteLabel}</span>
          <ExternalLink className="w-3.5 h-3.5 text-[#FF6BA3]" />
        </Link>
      </div>

      {/* Complete Toggle + Previous / Next Navigation */}
      <div className="pt-3 border-t border-purple-400/20 flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          size="md"
          variant={isCompleted ? 'outline' : 'primary'}
          leftIcon={
            isCompleted ? (
              <RotateCcw className="w-4 h-4 text-purple-300" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )
          }
          onClick={() => onToggleComplete(step.id)}
          data-testid="step-detail-mark-complete-btn"
          className="whitespace-nowrap"
        >
          {isCompleted ? 'Mark as Pending (Demo)' : 'Mark as Complete'}
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            disabled={!hasPrevious}
            onClick={onPreviousStep}
            data-testid="step-detail-prev-btn"
            className="border-purple-400/30 bg-[#1B0C36] hover:bg-[#281350] whitespace-nowrap"
          >
            Previous Step
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            disabled={!hasNext}
            onClick={onNextStep}
            data-testid="step-detail-next-btn"
            className="border-purple-400/30 bg-[#1B0C36] hover:bg-[#281350] whitespace-nowrap"
          >
            Next Step
          </Button>
        </div>
      </div>
    </section>
  );
};
