'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Edit3,
  Info,
  ShieldCheck,
  ShieldX,
} from 'lucide-react';
import {
  STATUS_METADATA_MAP,
  getDocumentTypeLabel,
  maskContactPhone,
  maskDateOfBirth,
  maskDocumentNumber,
} from './mockEarningIdentityData';
import { EarningIdentityState, EarningIdentityStatus } from './types';

interface VerificationStatusPanelProps {
  state: EarningIdentityState;
  onSelectStatusPreset: (status: EarningIdentityStatus) => void;
  onEditInformation: () => void;
  onBackToDashboard: () => void;
}

const ALL_STATUSES: EarningIdentityStatus[] = [
  'not_started',
  'incomplete',
  'submitted',
  'under_review',
  'verified',
  'rejected',
];

export const VerificationStatusPanel: React.FC<VerificationStatusPanelProps> = ({
  state,
  onSelectStatusPreset,
  onEditInformation,
  onBackToDashboard,
}) => {
  const meta = STATUS_METADATA_MAP[state.status];

  const renderStatusIcon = () => {
    switch (state.status) {
      case 'verified':
        return <ShieldCheck className="w-7 h-7 text-emerald-300" />;
      case 'rejected':
        return <ShieldX className="w-7 h-7 text-rose-300" />;
      case 'under_review':
      case 'submitted':
        return <Clock className="w-7 h-7 text-amber-300" />;
      default:
        return <AlertTriangle className="w-7 h-7 text-purple-200" />;
    }
  };

  return (
    <section
      data-testid="verification-status-screen"
      className="space-y-5"
    >
      {/* Main Verification Status Card */}
      <div className="rounded-3xl bg-[#130728]/95 border border-purple-400/20 p-5 sm:p-6 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-start gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#1E0C3E] border border-purple-400/25 flex items-center justify-center shrink-0">
              {renderStatusIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white">Verification Status</h2>
                <span
                  data-testid="status-screen-badge"
                  className={`px-3 py-0.5 rounded-full text-[11px] font-extrabold border ${meta.pillClasses}`}
                >
                  {meta.label}
                </span>
              </div>
              <p className={`text-sm font-bold mt-1 ${meta.textAccentClass}`}>{meta.headline}</p>
            </div>
          </div>

          <span className="text-xs font-extrabold text-amber-300 px-3 py-1 rounded-full bg-[#1C0D38] border border-amber-400/25 self-start sm:self-center whitespace-nowrap">
            Progress: {meta.progressPercent}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 rounded-full bg-[#241046] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#FF1A6C] via-[#EC4899] to-amber-400 transition-all duration-300"
            style={{ width: `${meta.progressPercent}%` }}
          />
        </div>

        <p className="text-xs sm:text-sm text-purple-100/80 leading-relaxed">{meta.description}</p>

        {/* Placeholder Rejection Note */}
        {state.status === 'rejected' && state.rejectionReasonPlaceholder && (
          <div
            data-testid="status-rejection-explanation"
            className="rounded-2xl bg-rose-500/10 border border-rose-400/35 p-4 space-y-1.5"
          >
            <div className="text-xs font-extrabold text-rose-300">Sample Review Feedback</div>
            <p className="text-xs text-rose-100/85 leading-relaxed">
              {state.rejectionReasonPlaceholder}
            </p>
          </div>
        )}

        {/* Explicit Frontend Demo Disclaimer */}
        <div className="rounded-2xl bg-[#1A0B35] border border-purple-400/20 p-3.5 flex items-start gap-2.5 text-xs">
          <Info className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
          <p className="text-purple-200/75 leading-relaxed">
            <strong className="text-white">Frontend Display State Only:</strong> No real KYC verification,
            server review, or automatic identity approval has taken place.
          </p>
        </div>

        {/* Host Identity Information Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-2xl bg-[#180A33] border border-white/10 p-3.5 space-y-1">
            <div className="text-[11px] text-purple-200/55">Host Account</div>
            <div className="font-extrabold text-white">
              {state.host.hostName} · ID {state.host.hostId}
            </div>
          </div>

          <div className="rounded-2xl bg-[#180A33] border border-white/10 p-3.5 space-y-1">
            <div className="text-[11px] text-purple-200/55 flex items-center gap-1">
              <CalendarClock className="w-3.5 h-3.5 text-[#FF4D8D]" />
              <span>Submission Date (Sample)</span>
            </div>
            <div className="font-bold text-white">
              {state.submittedAtLabel || 'Not submitted yet'}
            </div>
          </div>

          <div className="rounded-2xl bg-[#180A33] border border-white/10 p-3.5 space-y-1">
            <div className="text-[11px] text-purple-200/55">Legal Name &amp; Country</div>
            <div className="font-bold text-white">
              {state.form.legalFullName || 'Not entered'} · {state.form.countryName}
            </div>
          </div>

          <div className="rounded-2xl bg-[#180A33] border border-white/10 p-3.5 space-y-1">
            <div className="text-[11px] text-purple-200/55">Masked Birth Date &amp; Document</div>
            <div className="font-bold text-white font-mono">
              {maskDateOfBirth(state.form.dateOfBirth)} · {getDocumentTypeLabel(state.form.documentType)} (
              {maskDocumentNumber(state.form.documentNumber)})
            </div>
          </div>

          <div className="rounded-2xl bg-[#180A33] border border-white/10 p-3.5 space-y-1 sm:col-span-2">
            <div className="text-[11px] text-purple-200/55">Masked Contact &amp; Preview Status</div>
            <div className="font-bold text-white flex flex-wrap items-center justify-between gap-2">
              <span>{maskContactPhone(state.form.contactPhone)}</span>
              <span className="inline-flex items-center gap-1 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {state.frontDocument ? 'Local preview attached' : 'No preview attached'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <Button
            type="button"
            variant="ghost"
            size="md"
            data-testid="status-back-dashboard-btn"
            onClick={onBackToDashboard}
            className="border border-white/10 bg-[#1B0B38]/60 hover:bg-[#27124C]"
          >
            Back to Dashboard
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            data-testid="status-next-action-btn"
            onClick={onEditInformation}
            leftIcon={<Edit3 className="w-4 h-4" />}
          >
            {state.status === 'verified' ? 'Edit Sample Information' : meta.nextActionLabel}
          </Button>
        </div>
      </div>

      {/* Interactive Display State Switcher for QA / UI Review */}
      <div
        data-testid="status-state-preview-switcher"
        className="rounded-3xl bg-[#130728]/95 border border-purple-400/20 p-4 sm:p-5 space-y-3"
      >
        <div>
          <h3 className="text-xs sm:text-sm font-black text-white">
            Preview Verification Display States
          </h3>
          <p className="text-[11px] text-purple-200/60">
            Switch between sample display states to inspect UI badges, explanations, and next actions
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {ALL_STATUSES.map((st) => {
            const stMeta = STATUS_METADATA_MAP[st];
            const active = state.status === st;
            return (
              <button
                key={st}
                type="button"
                data-testid={`preview-status-btn-${st}`}
                onClick={() => onSelectStatusPreset(st)}
                className={`px-3 py-2 rounded-2xl text-xs font-extrabold border transition-all text-center ${
                  active
                    ? 'bg-gradient-to-r from-[#FF1A6C] to-[#EC4899] border-[#FF4D8D] text-white shadow-glow-pink'
                    : 'bg-[#1A0B35] border-white/10 text-purple-100/80 hover:border-purple-400/40'
                }`}
              >
                {stMeta.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
