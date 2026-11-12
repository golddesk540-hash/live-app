'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import {
  Flag,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Info,
} from 'lucide-react';
import {
  LocalDemoReport,
  REPORT_REASON_OPTIONS,
  ReportReasonId,
  ReportTarget,
} from './types';

interface ReportModalProps {
  target: ReportTarget | null;
  alreadyReported?: boolean;
  onClose: () => void;
  onSubmitReport: (report: Omit<LocalDemoReport, 'id' | 'submittedAt'>) => void;
}

const MAX_DETAILS_LEN = 300;

export const ReportModal: React.FC<ReportModalProps> = ({
  target,
  alreadyReported = false,
  onClose,
  onSubmitReport,
}) => {
  const [selectedReasonId, setSelectedReasonId] = useState<ReportReasonId | null>(null);
  const [details, setDetails] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submittedReport, setSubmittedReport] = useState<{
    reasonLabel: string;
    details: string;
  } | null>(null);

  useEffect(() => {
    setSelectedReasonId(null);
    setDetails('');
    setValidationError(null);
    setSubmittedReport(null);
  }, [target?.id, target?.type]);

  if (!target) return null;

  const selectedReason = REPORT_REASON_OPTIONS.find((r) => r.id === selectedReasonId) || null;
  const isPost = target.type === 'post';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (alreadyReported) {
      setValidationError(
        `A local demo report has already been submitted for this ${isPost ? 'post' : 'comment'}.`
      );
      return;
    }
    if (!selectedReason) {
      setValidationError('Please select a report reason before submitting.');
      return;
    }
    const cleanDetails = details.trim();
    onSubmitReport({
      targetType: target.type,
      targetId: target.id,
      postId: target.postId,
      targetAuthor: target.authorName,
      targetPreview: target.previewText,
      reasonId: selectedReason.id,
      reasonLabel: selectedReason.label,
      details: cleanDetails,
    });
    setValidationError(null);
    setSubmittedReport({
      reasonLabel: selectedReason.label,
      details: cleanDetails,
    });
  };

  return (
    <Modal
      isOpen={Boolean(target)}
      onClose={onClose}
      title={
        submittedReport
          ? 'Report Submitted'
          : isPost
          ? 'Report Post'
          : 'Report Comment'
      }
      subtitle={
        submittedReport
          ? 'Saved in local frontend demo state only'
          : `${isPost ? 'Post' : 'Comment'} by ${target.authorName}`
      }
      maxWidth="md"
      className="bg-[#120726] border-purple-400/25"
    >
      {submittedReport ? (
        <div data-testid="report-confirmation-screen" className="space-y-4 py-2 text-center">
          <div className="w-14 h-14 rounded-full mx-auto bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-lg">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h4 className="text-base font-black text-white">
              Thank You for Helping Keep Popo Live Safe
            </h4>
            <p className="text-xs text-purple-100/80 leading-relaxed max-w-sm mx-auto">
              Your local demo report against{' '}
              <strong className="text-white">{target.authorName}</strong> for{' '}
              <strong className="text-[#FF6BA3]">{submittedReport.reasonLabel}</strong> has been
              recorded in this session.
            </p>
          </div>

          {submittedReport.details && (
            <div className="rounded-2xl bg-[#1A0D35] border border-white/10 p-3 text-left text-xs text-purple-100/80">
              <div className="text-[10px] font-bold uppercase tracking-wider text-purple-200/50 mb-1">
                Additional notes recorded
              </div>
              <p className="break-words">{submittedReport.details}</p>
            </div>
          )}

          <div className="rounded-2xl bg-[#180B30] border border-amber-400/25 p-3 text-left text-[11px] text-amber-200/90 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
            <span>
              Frontend Demo Notice: Reports remain strictly in local browser state and are not sent
              to an external moderation team.
            </span>
          </div>

          <div className="pt-1 flex justify-center">
            <Button
              variant="primary"
              size="sm"
              data-testid="report-done-btn"
              onClick={onClose}
            >
              Done
            </Button>
          </div>
        </div>
      ) : alreadyReported ? (
        <div data-testid="report-duplicate-state" className="space-y-4 py-2 text-center">
          <div className="w-12 h-12 rounded-full mx-auto bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black text-white">Report Already Submitted</h4>
            <p className="text-xs text-purple-100/75 max-w-xs mx-auto leading-relaxed">
              You already submitted a local demo report for this {isPost ? 'post' : 'comment'} in
              this session. Duplicate demo reports are prevented.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Preview Card */}
          <div
            data-testid="report-target-preview"
            className="rounded-2xl bg-[#1A0D35] border border-white/10 p-3 space-y-1.5"
          >
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="font-extrabold text-[#FF4D8D] uppercase tracking-wider">
                {isPost ? 'Post Preview' : 'Comment Preview'}
              </span>
              <span className="text-purple-200/60">
                {target.authorName}
                {target.timestamp ? ` · ${target.timestamp}` : ''}
              </span>
            </div>
            <p className="text-xs text-purple-100/85 line-clamp-2 break-words">
              {target.previewText.trim() || 'No preview content available.'}
            </p>
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-white">
                Select a report reason
              </span>
              {!selectedReason && (
                <span
                  data-testid="report-no-reason-state"
                  className="text-[10px] font-semibold text-amber-300/90"
                >
                  No report reason selected
                </span>
              )}
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {REPORT_REASON_OPTIONS.map((option) => {
                const active = selectedReasonId === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    data-testid={`report-reason-${option.id}`}
                    onClick={() => {
                      setSelectedReasonId(option.id);
                      if (validationError) setValidationError(null);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-2xl border transition-all flex items-start gap-2.5 ${
                      active
                        ? 'bg-[#FF1A6C]/20 border-[#FF1A6C] text-white shadow-sm'
                        : 'bg-[#180B30] border-white/10 text-purple-100/80 hover:border-purple-300/35'
                    }`}
                  >
                    <span
                      className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        active ? 'border-[#FF1A6C] bg-[#FF1A6C]' : 'border-purple-300/45'
                      }`}
                    >
                      {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold leading-tight">{option.label}</div>
                      <div className="text-[10px] text-purple-200/60 mt-0.5 leading-snug">
                        {option.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Details */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="report-details-input" className="font-bold text-purple-100">
                Additional details <span className="text-purple-200/45 font-normal">(optional)</span>
              </label>
              <span
                data-testid="report-details-counter"
                className={`text-[10px] font-mono ${
                  details.length >= MAX_DETAILS_LEN ? 'text-amber-300' : 'text-purple-200/55'
                }`}
              >
                {details.length} / {MAX_DETAILS_LEN}
              </span>
            </div>

            <textarea
              id="report-details-input"
              rows={2}
              maxLength={MAX_DETAILS_LEN}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              data-testid="report-details-input"
              placeholder="Share extra context for this local demo report..."
              className="w-full rounded-2xl bg-[#0C041C] border border-purple-400/20 focus:border-[#FF1A6C] outline-none px-3.5 py-2.5 text-xs text-white placeholder:text-purple-200/40 resize-none"
            />
          </div>

          {validationError && (
            <div
              data-testid="report-validation-error"
              className="rounded-xl bg-amber-500/15 border border-amber-400/40 px-3 py-2 text-xs font-semibold text-amber-200 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-300" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              data-testid="report-cancel-btn"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              data-testid="report-submit-btn"
              leftIcon={<Flag className="w-3.5 h-3.5" />}
            >
              Submit Report
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
