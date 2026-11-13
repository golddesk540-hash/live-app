'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  History,
  Lock,
  Paperclip,
  Save,
  Shield,
  ShieldAlert,
  Sparkles,
  Tag,
  User,
  UserCheck,
  UserX,
} from 'lucide-react';
import { ChildSafetyEmptyStates } from './ChildSafetyEmptyStates';
import { ChildSafetyEvidenceModal } from './ChildSafetyEvidenceModal';
import {
  SafetyCaseRecord,
  SafetyEvidenceItem,
  SafetyPriority,
  SafetyCaseStatus,
} from './childSafetyTypes';

interface SafetyCaseDetailsViewProps {
  safetyCase: SafetyCaseRecord;
  onBack: () => void;
  onOpenReviewModal: (safetyCase: SafetyCaseRecord) => void;
  onChangePriority: (caseId: string, priority: SafetyPriority) => void;
  onSaveNotes: (caseId: string, notes: string) => void;
  onNavigateToUser?: (userId: string) => void;
  onNavigateToHost?: (hostId: string) => void;
}

export const SafetyCaseDetailsView: React.FC<SafetyCaseDetailsViewProps> = ({
  safetyCase,
  onBack,
  onOpenReviewModal,
  onChangePriority,
  onSaveNotes,
  onNavigateToUser,
  onNavigateToHost,
}) => {
  const [selectedEvidence, setSelectedEvidence] = useState<SafetyEvidenceItem | null>(null);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState<boolean>(false);
  const [notesText, setNotesText] = useState<string>(safetyCase.reviewerNotes || '');
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  const handleOpenEvidence = (ev: SafetyEvidenceItem) => {
    setSelectedEvidence(ev);
    setIsEvidenceModalOpen(true);
  };

  const handleSaveNotes = () => {
    setIsSavingNotes(true);
    setTimeout(() => {
      onSaveNotes(safetyCase.id, notesText);
      setIsSavingNotes(false);
      setSaveSuccessMsg('Notes saved to audit file.');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    }, 300);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#1A103C]/80 border border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors"
            title="Back to Cases"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-extrabold text-white">
                {safetyCase.id}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  safetyCase.status === 'Resolved'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : safetyCase.status === 'Escalated'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                }`}
              >
                {safetyCase.status}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  safetyCase.priority === 'Urgent'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : safetyCase.priority === 'High'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                }`}
              >
                {safetyCase.priority}
              </span>
              {safetyCase.isEscalated && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500 text-white flex items-center gap-1 shadow-md">
                  <ArrowUpRight className="w-3 h-3" /> ESCALATED
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Logged {safetyCase.createdDate} ({safetyCase.createdRelative})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Priority Quick Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0B0716] border border-white/10 text-xs">
            <span className="text-[10px] text-gray-400 px-2 font-semibold">Priority:</span>
            {(['Low', 'Medium', 'High', 'Urgent'] as SafetyPriority[]).map((p) => (
              <button
                key={p}
                onClick={() => onChangePriority(safetyCase.id, p)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  safetyCase.priority === p
                    ? 'bg-pink-500 text-white shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={() => onOpenReviewModal(safetyCase)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-[0_0_20px_rgba(255,15,123,0.35)] transition-all active:scale-95"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Safety Disposition</span>
          </button>
        </div>
      </div>

      {/* 2. Target Profile & Linkage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Account Info */}
        <div className="p-5 rounded-2xl bg-[#1A103C]/70 border border-white/10">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-300">
              <User className="w-4 h-4 text-pink-400" />
              Target Account Under Review
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                safetyCase.relatedUserStatus === 'Active'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {safetyCase.relatedUserStatus}
            </span>
          </div>

          <div className="flex items-start gap-3.5">
            <img
              src={safetyCase.relatedUserAvatar}
              alt={safetyCase.relatedUsername}
              className="w-14 h-14 rounded-2xl object-cover border border-white/15 shadow-md"
            />
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white truncate">
                  {safetyCase.relatedUsername}
                </h3>
                <span className="text-xs text-gray-400 font-mono">
                  {safetyCase.relatedUserId}
                </span>
              </div>
              <div className="text-xs text-gray-300">
                {safetyCase.isHost ? 'Broadcasting Host' : 'Registered Member'}
              </div>
              <div className="flex items-center gap-3 text-[11px] text-gray-400 pt-1">
                {safetyCase.relatedHostId && (
                  <span>Host ID: {safetyCase.relatedHostId}</span>
                )}
                <span>Category: {safetyCase.category}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-[11px] text-gray-500">
              Reviewer: {safetyCase.assignedReviewer}
            </span>
            <div className="flex items-center gap-3">
              {safetyCase.isHost && safetyCase.relatedHostId && onNavigateToHost && (
                <button
                  onClick={() => onNavigateToHost(safetyCase.relatedHostId!)}
                  className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-semibold"
                >
                  <span>Host Sheet</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
              {onNavigateToUser && (
                <button
                  onClick={() => onNavigateToUser(safetyCase.relatedUserId)}
                  className="flex items-center gap-1 text-xs text-pink-400 hover:text-pink-300 font-semibold"
                >
                  <span>User Record</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Report Linkage & Escalation Panel */}
        <div className="p-5 rounded-2xl bg-[#1A103C]/70 border border-white/10 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-300">
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              Incident Escalation Status
            </div>
            <span className="text-xs text-gray-400 font-mono">
              Report: {safetyCase.relatedReportId || 'Direct'}
            </span>
          </div>

          {safetyCase.isEscalated ? (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                <ArrowUpRight className="w-4 h-4" /> Active High-Priority Escalation
              </div>
              <p className="text-xs text-gray-200 leading-relaxed">
                {safetyCase.escalationReason}
              </p>
              <div className="text-[10px] text-gray-400">
                Escalated on: {safetyCase.escalatedAt || safetyCase.createdDate}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-gray-400 leading-relaxed">
              Standard child safety review backlog. No emergency escalation triggered at this time.
            </div>
          )}
        </div>
      </div>

      {/* 3. Narrative & Description */}
      <div className="p-5 rounded-2xl bg-[#1A103C]/70 border border-white/10 space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-pink-400">
          Case Narrative & Telemetry
        </h3>
        <h4 className="text-sm font-bold text-white">{safetyCase.shortDescription}</h4>
        <p className="text-xs text-gray-300 leading-relaxed">{safetyCase.fullDescription}</p>
      </div>

      {/* 4. Evidence Attachments */}
      <div className="p-5 rounded-2xl bg-[#1A103C]/70 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-pink-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Incident Evidence Files ({safetyCase.evidenceItems.length})
            </h3>
          </div>
          <span className="text-[11px] text-gray-400">
            Demo placeholders · Sensitive content redacted
          </span>
        </div>

        {safetyCase.evidenceItems.length === 0 ? (
          <ChildSafetyEmptyStates type="no_evidence" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {safetyCase.evidenceItems.map((ev) => (
              <div
                key={ev.id}
                onClick={() => handleOpenEvidence(ev)}
                className="cursor-pointer group p-3 rounded-xl bg-[#0B0716] border border-white/10 hover:border-pink-500/50 hover:bg-[#120A2A] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-black/40 border border-white/10 mb-2.5">
                    <img
                      src={ev.safeThumbnailUrl}
                      alt={ev.description}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold">
                      <Eye className="w-4 h-4" />
                      <span>Inspect Evidence</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors truncate">
                      {ev.category}
                    </h4>
                    <span className="font-mono text-[10px] text-gray-400">{ev.referenceId}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 line-clamp-2 leading-snug">
                    {ev.description}
                  </p>
                </div>

                <div className="pt-2 mt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
                  <span className="uppercase font-mono">{ev.type}</span>
                  <span className="text-emerald-400">{ev.reviewStatus}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Reviewer Notes & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Notes */}
        <div className="p-5 rounded-2xl bg-[#1A103C]/70 border border-white/10 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Safety Officer Audit Notes
              </h3>
              {saveSuccessMsg && (
                <span className="text-[11px] text-emerald-400 font-semibold animate-fadeIn">
                  {saveSuccessMsg}
                </span>
              )}
            </div>
            <textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Record findings, KYC checklist, or resolution rationale..."
              rows={5}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0716] border border-white/15 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 resize-none transition-all"
            />
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              onClick={handleSaveNotes}
              disabled={isSavingNotes}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/20 hover:border-pink-500/40 transition-all active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingNotes ? 'Saving...' : 'Save Audit Notes'}</span>
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="p-5 rounded-2xl bg-[#1A103C]/70 border border-white/10 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <History className="w-4 h-4 text-pink-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Case Audit Timeline
            </h3>
          </div>

          <div className="space-y-3">
            {safetyCase.timeline.map((act, idx) => (
              <div key={act.id} className="relative pl-6 pb-2 text-xs">
                {idx < safetyCase.timeline.length - 1 && (
                  <div className="absolute left-2 top-3 bottom-0 w-0.5 bg-white/10" />
                )}
                <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-pink-500/20 border border-pink-500/50 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{act.title}</span>
                    <span className="text-[10px] text-gray-500">{act.timestamp}</span>
                  </div>
                  <div className="text-[11px] text-pink-400 font-medium">
                    By: {act.adminName}
                  </div>
                  <p className="text-gray-400 text-[11px] mt-0.5">{act.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Evidence Fullscreen Modal */}
      <ChildSafetyEvidenceModal
        evidence={selectedEvidence}
        caseId={safetyCase.id}
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
      />
    </div>
  );
};
