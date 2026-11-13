'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  History,
  Image as ImageIcon,
  MessageSquare,
  Paperclip,
  Save,
  Shield,
  ShieldAlert,
  Sparkles,
  Tag,
  User,
  UserCheck,
  UserX,
  XCircle,
} from 'lucide-react';
import { ReportEvidencePreviewModal } from './ReportEvidencePreviewModal';
import { ReportQueueEmptyStates } from './ReportQueueEmptyStates';
import {
  ReportEvidenceItem,
  ReportPriority,
  ReportRecord,
  ReportStatus,
} from './reportQueueTypes';

interface ReportDetailsViewProps {
  report: ReportRecord;
  onBack: () => void;
  onOpenReviewModal: (report: ReportRecord) => void;
  onChangePriority: (reportId: string, newPriority: ReportPriority) => void;
  onSaveAdminNotes: (reportId: string, notes: string) => void;
  onNavigateToUser?: (userId: string) => void;
  onNavigateToHost?: (hostId: string) => void;
}

export const ReportDetailsView: React.FC<ReportDetailsViewProps> = ({
  report,
  onBack,
  onOpenReviewModal,
  onChangePriority,
  onSaveAdminNotes,
  onNavigateToUser,
  onNavigateToHost,
}) => {
  const [selectedEvidence, setSelectedEvidence] = useState<ReportEvidenceItem | null>(null);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState<boolean>(false);
  const [adminNotesText, setAdminNotesText] = useState<string>(report.adminNotes || '');
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  const handleOpenEvidence = (ev: ReportEvidenceItem) => {
    setSelectedEvidence(ev);
    setIsEvidenceModalOpen(true);
  };

  const handleSaveNotes = () => {
    setIsSavingNotes(true);
    setTimeout(() => {
      onSaveAdminNotes(report.id, adminNotesText);
      setIsSavingNotes(false);
      setSaveSuccessMsg('Notes saved successfully');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    }, 300);
  };

  const getPriorityBadge = (prio: ReportPriority) => {
    switch (prio) {
      case 'Urgent':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.3)]';
      case 'High':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
      case 'Medium':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/40';
    }
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.25)]';
      case 'Under Review':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.25)]';
      case 'Resolved':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.25)]';
      case 'Rejected':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Top Navigation & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#1A103C]/80 border border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors"
            title="Back to Reports"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-extrabold text-white">
                {report.id}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                  report.status
                )}`}
              >
                {report.status}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadge(
                  report.priority
                )}`}
              >
                {report.priority}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Submitted {report.submittedAt} ({report.submittedRelative})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Priority Quick Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0B0716] border border-white/10 text-xs">
            <span className="text-[10px] text-gray-400 px-2 font-semibold">Priority:</span>
            {(['Low', 'Medium', 'High', 'Urgent'] as ReportPriority[]).map((p) => (
              <button
                key={p}
                onClick={() => onChangePriority(report.id, p)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  report.priority === p
                    ? 'bg-pink-500 text-white shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Open Review Modal Trigger */}
          <button
            onClick={() => onOpenReviewModal(report)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-[0_0_20px_rgba(255,15,123,0.35)] transition-all active:scale-95"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Review & Disposition</span>
          </button>
        </div>
      </div>

      {/* 2. Side-by-Side Account Cards (Section 7 & 8) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SECTION 7: REPORTER INFORMATION CARD */}
        <div className="p-5 rounded-2xl bg-[#1A103C]/70 border border-white/10 hover:border-pink-500/30 transition-all">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-300">
              <User className="w-4 h-4 text-pink-400" />
              Reporter Information
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {report.reporter.accountStatus}
            </span>
          </div>

          <div className="flex items-start gap-3.5">
            <img
              src={report.reporter.avatar}
              alt={report.reporter.username}
              className="w-14 h-14 rounded-2xl object-cover border border-white/15 shadow-md"
            />
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white truncate">
                  {report.reporter.username}
                </h3>
                <span className="text-xs text-gray-400 font-mono">
                  {report.reporter.userId}
                </span>
              </div>
              <div className="text-xs text-gray-300">{report.reporter.nickname}</div>
              <div className="flex items-center gap-3 text-[11px] text-gray-400 pt-1">
                <span>Country: {report.reporter.country}</span>
                <span>•</span>
                <span>Reports Filed: {report.reporter.reportsSubmittedCount}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-[11px] text-gray-500">
              Registered: {report.reporter.registrationDate}
            </span>
            {onNavigateToUser && (
              <button
                onClick={() => onNavigateToUser(report.reporter.userId)}
                className="flex items-center gap-1 text-xs text-pink-400 hover:text-pink-300 font-semibold"
              >
                <span>View User Profile</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* SECTION 8: REPORTED TARGET ACCOUNT CARD */}
        <div className="p-5 rounded-2xl bg-[#1A103C]/70 border border-white/10 hover:border-pink-500/30 transition-all">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-300">
              <UserX className="w-4 h-4 text-rose-400" />
              Reported Account Information
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-gray-200">
                {report.reported.accountType}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  report.reported.accountStatus === 'Active'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {report.reported.accountStatus}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="relative shrink-0">
              <img
                src={report.reported.avatar}
                alt={report.reported.username}
                className="w-14 h-14 rounded-2xl object-cover border border-white/15 shadow-md"
              />
              {report.reported.isHost && (
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-gradient-to-r from-pink-500 to-purple-600 rounded text-[9px] font-bold text-white uppercase shadow">
                  Host
                </span>
              )}
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white truncate">
                  {report.reported.username}
                </h3>
                <span className="text-xs text-gray-400 font-mono">
                  {report.reported.accountId}
                </span>
              </div>
              <div className="text-xs text-gray-300">{report.reported.nickname}</div>
              <div className="flex items-center gap-3 text-[11px] text-gray-400 pt-1">
                <span>{report.reported.country}</span>
                {report.reported.hostTier && <span>• {report.reported.hostTier}</span>}
                {report.reported.agencyName && (
                  <span>• {report.reported.agencyName}</span>
                )}
                <span>• Violations: {report.reported.violationsCount}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-[11px] text-gray-500">
              Registered: {report.reported.registrationDate}
            </span>
            <div className="flex items-center gap-3">
              {report.reported.isHost && onNavigateToHost && report.reported.hostId && (
                <button
                  onClick={() => onNavigateToHost(report.reported.hostId!)}
                  className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-semibold"
                >
                  <span>Host Profile</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
              {onNavigateToUser && (
                <button
                  onClick={() => onNavigateToUser(report.reported.accountId)}
                  className="flex items-center gap-1 text-xs text-pink-400 hover:text-pink-300 font-semibold"
                >
                  <span>User Record</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Report Narrative & Description */}
      <div className="p-5 rounded-2xl bg-[#1A103C]/70 border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-pink-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Category: <span className="text-pink-400">{report.categoryLabel}</span>
            </h3>
          </div>
          <span className="text-xs text-gray-400">Assigned Admin: {report.assignedAdmin}</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0B0716] border border-white/5 space-y-2">
          <h4 className="text-sm font-bold text-white">{report.shortDescription}</h4>
          <p className="text-xs text-gray-300 leading-relaxed">{report.fullDescription}</p>
        </div>
      </div>

      {/* 4. SECTION 9: REPORT EVIDENCE PREVIEW */}
      <div className="p-5 rounded-2xl bg-[#1A103C]/70 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-pink-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Evidence Attachments ({report.evidence.length})
            </h3>
          </div>
          <span className="text-[11px] text-gray-400">
            Frontend sample preview only · Secure mock sandbox
          </span>
        </div>

        {report.evidence.length === 0 ? (
          <ReportQueueEmptyStates type="no_evidence" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {report.evidence.map((ev) => (
              <div
                key={ev.id}
                onClick={() => handleOpenEvidence(ev)}
                className="cursor-pointer group p-3 rounded-xl bg-[#0B0716] border border-white/10 hover:border-pink-500/50 hover:bg-[#120A2A] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-black/40 border border-white/10 mb-2.5">
                    {ev.type === 'chat_log' ? (
                      <div className="w-full h-full p-2.5 font-mono text-[10px] text-gray-300 overflow-hidden line-clamp-4">
                        [Chat Log Extract]
                        <br />
                        User: Message flagged by viewer...
                        <br />
                        Timestamp: {ev.timestamp}
                      </div>
                    ) : (
                      <img
                        src={ev.url}
                        alt={ev.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold">
                      <Eye className="w-4 h-4" />
                      <span>Click to Inspect</span>
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors truncate">
                    {ev.title}
                  </h4>
                  <p className="text-[11px] text-gray-400 line-clamp-2 mt-0.5 leading-snug">
                    {ev.caption}
                  </p>
                </div>

                <div className="pt-2 mt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
                  <span className="uppercase font-mono">{ev.type}</span>
                  <span>{ev.fileSize}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Moderator Notes & Audit Activity History (Section 10 & 13) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Moderator Review Notes */}
        <div className="p-5 rounded-2xl bg-[#1A103C]/70 border border-white/10 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-pink-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Moderator Notes
                </h3>
              </div>
              {saveSuccessMsg && (
                <span className="text-[11px] text-emerald-400 font-semibold animate-fadeIn">
                  {saveSuccessMsg}
                </span>
              )}
            </div>
            <textarea
              value={adminNotesText}
              onChange={(e) => setAdminNotesText(e.target.value)}
              placeholder="Record findings, internal comments, or next-step recommendations..."
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
              <span>{isSavingNotes ? 'Saving...' : 'Save Notes'}</span>
            </button>
          </div>
        </div>

        {/* SECTION 13: REPORT ACTIVITY HISTORY TIMELINE */}
        <div className="p-5 rounded-2xl bg-[#1A103C]/70 border border-white/10 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <History className="w-4 h-4 text-pink-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Activity History Timeline
            </h3>
          </div>

          <div className="space-y-3">
            {report.reviewHistory.map((act, idx) => (
              <div key={act.id} className="relative pl-6 pb-2 text-xs">
                {/* Vertical timeline line */}
                {idx < report.reviewHistory.length - 1 && (
                  <div className="absolute left-2 top-3 bottom-0 w-0.5 bg-white/10" />
                )}
                {/* Node circle */}
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
      <ReportEvidencePreviewModal
        evidence={selectedEvidence}
        reportId={report.id}
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
      />
    </div>
  );
};
