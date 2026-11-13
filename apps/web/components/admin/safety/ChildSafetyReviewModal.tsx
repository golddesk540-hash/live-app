'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  RotateCcw,
  Shield,
  ShieldAlert,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react';
import {
  SafetyCaseRecord,
  SafetyCaseStatus,
  SafetyPriority,
} from './childSafetyTypes';

interface ChildSafetyReviewModalProps {
  safetyCase: SafetyCaseRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveReview: (
    caseId: string,
    newStatus: SafetyCaseStatus,
    newPriority: SafetyPriority,
    reviewerNotes: string,
    isEscalated: boolean,
    escalationReason?: string
  ) => void;
}

export const ChildSafetyReviewModal: React.FC<ChildSafetyReviewModalProps> = ({
  safetyCase,
  isOpen,
  onClose,
  onSaveReview,
}) => {
  if (!isOpen || !safetyCase) return null;

  const [selectedStatus, setSelectedStatus] = useState<SafetyCaseStatus>(safetyCase.status);
  const [selectedPriority, setSelectedPriority] = useState<SafetyPriority>(safetyCase.priority);
  const [notes, setNotes] = useState<string>(safetyCase.reviewerNotes || '');
  const [isEscalated, setIsEscalated] = useState<boolean>(safetyCase.isEscalated || false);
  const [escalationReason, setEscalationReason] = useState<string>(
    safetyCase.escalationReason || 'Senior Trust & Safety escalation requested.'
  );
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  const statusOptions: {
    status: SafetyCaseStatus;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    desc: string;
  }[] = [
    {
      status: 'Under Review',
      label: 'Mark as Under Review',
      icon: Clock,
      color: 'border-purple-500/40 text-purple-300 bg-purple-500/10',
      desc: 'Active moderation inspection in progress',
    },
    {
      status: 'Escalated',
      label: 'Mark as Escalated',
      icon: ArrowUpRight,
      color: 'border-rose-500/40 text-rose-300 bg-rose-500/10',
      desc: 'Escalate to Duty Safety Lead for immediate sanction',
    },
    {
      status: 'Resolved',
      label: 'Mark as Resolved',
      icon: CheckCircle2,
      color: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10',
      desc: 'Clearance certified or protective action completed',
    },
    {
      status: 'Pending',
      label: 'Return to Pending',
      icon: RotateCcw,
      color: 'border-amber-500/40 text-amber-300 bg-amber-500/10',
      desc: 'Send back to initial triage queue',
    },
    {
      status: 'Closed',
      label: 'Close Demo Case',
      icon: XCircle,
      color: 'border-gray-500/40 text-gray-300 bg-gray-500/10',
      desc: 'Conclude investigation and archive file',
    },
  ];

  const priorityLevels: { level: SafetyPriority; color: string }[] = [
    { level: 'Low', color: 'border-gray-500/30 text-gray-300 bg-gray-500/10' },
    { level: 'Medium', color: 'border-blue-500/30 text-blue-300 bg-blue-500/10' },
    { level: 'High', color: 'border-amber-500/30 text-amber-300 bg-amber-500/10' },
    { level: 'Urgent', color: 'border-rose-500/30 text-rose-300 bg-rose-500/10' },
  ];

  const handleConfirmSubmit = () => {
    onSaveReview(
      safetyCase.id,
      selectedStatus,
      selectedPriority,
      notes,
      selectedStatus === 'Escalated' || isEscalated,
      selectedStatus === 'Escalated' ? escalationReason : undefined
    );
    setShowConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#120A2A] border border-pink-500/30 rounded-2xl shadow-[0_0_50px_rgba(255,15,123,0.3)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1A103C]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-pink-400">
                  Child Safety Disposition Panel
                </span>
                <span className="font-mono text-xs text-white font-bold">{safetyCase.id}</span>
              </div>
              <p className="text-xs text-gray-400">
                {safetyCase.category} · Target: {safetyCase.relatedUsername}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Summary Box */}
          <div className="p-3.5 rounded-xl bg-[#1A103C]/80 border border-white/10 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-gray-400">Related Report: {safetyCase.relatedReportId || 'Direct Flag'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-gray-300">
                Current: {safetyCase.status}
              </span>
            </div>
            <p className="text-white font-medium">{safetyCase.shortDescription}</p>
          </div>

          {/* Disposition Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-2">
              Select Demo Case Disposition
            </label>
            <div className="space-y-2">
              {statusOptions.map((opt) => {
                const isSelected = selectedStatus === opt.status;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.status}
                    type="button"
                    onClick={() => {
                      setSelectedStatus(opt.status);
                      if (opt.status === 'Escalated') setIsEscalated(true);
                    }}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? `${opt.color} ring-2 ring-pink-500 shadow-md`
                        : 'border-white/10 bg-white/[0.02] text-gray-400 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-white">{opt.label}</div>
                      <div className="text-[11px] text-gray-400 leading-snug">{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-2">
              Incident Priority Level
            </label>
            <div className="grid grid-cols-4 gap-2">
              {priorityLevels.map((p) => {
                const isSelected = selectedPriority === p.level;
                return (
                  <button
                    key={p.level}
                    type="button"
                    onClick={() => setSelectedPriority(p.level)}
                    className={`py-2 px-3 rounded-xl border text-center text-xs font-bold transition-all ${
                      isSelected
                        ? `${p.color} ring-1 ring-pink-500 shadow-md`
                        : 'border-white/10 bg-white/[0.02] text-gray-400 hover:bg-white/5'
                    }`}
                  >
                    {p.level}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Escalation Reason Input if Escalated */}
          {selectedStatus === 'Escalated' && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2 animate-fadeIn">
              <label className="block text-xs font-bold text-rose-300">
                Escalation Rationale (Required)
              </label>
              <input
                type="text"
                value={escalationReason}
                onChange={(e) => setEscalationReason(e.target.value)}
                placeholder="Reason for immediate senior safety review..."
                className="w-full px-3 py-2 rounded-lg bg-[#0B0716] border border-rose-500/40 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-400"
              />
            </div>
          )}

          {/* Reviewer Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Safety Officer Case Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record findings, document inspection status, or recommendations..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0716] border border-white/15 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 resize-none transition-all"
            />
          </div>

          {/* Confirmation Prompt */}
          {showConfirm && (
            <div className="p-4 rounded-xl bg-pink-500/10 border border-pink-500/40 animate-fadeIn">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold text-white">Confirm Demo Status Change</div>
                  <p className="text-gray-300 mt-1 leading-relaxed">
                    Update <strong>{safetyCase.id}</strong> to{' '}
                    <span className="text-pink-400 font-bold">{selectedStatus}</span> with priority{' '}
                    <span className="text-pink-400 font-bold">{selectedPriority}</span>?
                  </p>
                  <p className="text-gray-400 text-[11px] mt-1 italic">
                    (Note: This is simulated frontend state. No real account bans or moderation occur.)
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={handleConfirmSubmit}
                      className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-xs shadow-lg transition-all"
                    >
                      Yes, Save Review
                    </button>
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-gray-300 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#1A103C] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
          >
            Cancel
          </button>
          {!showConfirm && (
            <button
              onClick={() => setShowConfirm(true)}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-[0_0_20px_rgba(255,15,123,0.35)] transition-all active:scale-95"
            >
              Save Demo Review
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
