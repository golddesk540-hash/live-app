'use client';

import React, { useState } from 'react';
import { InviteHistoryRecord, InviteStatusType } from './types';
import { Button } from '@/components/ui/Button';
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Hourglass,
  Link2,
  Send,
  ShieldCheck,
  User,
} from 'lucide-react';

const STATUS_DISPLAY: Record<InviteStatusType, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-400/15 border-amber-300/40 text-amber-200',
  },
  joined: {
    label: 'Joined',
    className: 'bg-emerald-500/20 border-emerald-400/45 text-emerald-200',
  },
  expired: {
    label: 'Expired',
    className: 'bg-slate-500/20 border-slate-400/35 text-slate-300',
  },
};

interface InviteDetailViewProps {
  record: InviteHistoryRecord | null;
  onBackMobile: () => void;
  onCopyText: (text: string, label: string) => Promise<void>;
}

export const InviteDetailView: React.FC<InviteDetailViewProps> = ({
  record,
  onBackMobile,
  onCopyText,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  if (!record) {
    return (
      <div className="hidden lg:flex flex-col items-center justify-center min-h-[300px] rounded-3xl bg-[#130728]/85 border border-purple-400/15 p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#FF1A6C]/20 border border-[#FF1A6C]/35 flex items-center justify-center mb-3 shadow-glow-pink">
          <Link2 className="w-6 h-6 text-[#FF4D8D]" />
        </div>
        <h3 className="text-base font-extrabold text-white">Select an Invitation Record</h3>
        <p className="text-xs text-purple-200/65 max-w-xs mt-1">
          Click any record in Invite History to inspect its invite code, link, delivery method, and status details.
        </p>
      </div>
    );
  }

  const badge = STATUS_DISPLAY[record.status];

  const handleCopy = async () => {
    await onCopyText(record.inviteLink, 'Invitation link');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1800);
  };

  return (
    <div
      data-testid="invite-detail-view"
      className="rounded-3xl bg-[#16092D]/95 border border-purple-400/25 p-5 space-y-4 shadow-xl"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBackMobile}
            data-testid="invite-detail-back-btn"
            aria-label="Back to Invite History"
            className="lg:hidden p-2 rounded-full bg-[#241046] hover:bg-[#311761] text-white border border-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <h3 className="text-base font-black text-white">Invitation Details</h3>
            <p className="text-[11px] text-purple-200/60">Record #{record.id}</p>
          </div>
        </div>

        <span
          data-testid="invite-detail-status-pill"
          className={`px-3 py-1 rounded-full border text-xs font-extrabold inline-flex items-center gap-1.5 ${badge.className}`}
        >
          {record.status === 'joined' ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : record.status === 'pending' ? (
            <Clock className="w-3.5 h-3.5" />
          ) : (
            <Hourglass className="w-3.5 h-3.5" />
          )}
          <span>{badge.label}</span>
        </span>
      </div>

      <div className="rounded-2xl bg-[#110523] border border-purple-400/20 p-4 space-y-3 text-xs">
        <div className="flex items-center justify-between gap-3">
          <span className="text-purple-200/60 inline-flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#FF4D8D]" /> Contact Name
          </span>
          <span data-testid="invite-detail-contact" className="font-extrabold text-white">
            {record.contactName}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-purple-200/60 inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" /> Invitation Code
          </span>
          <span className="font-mono font-black text-amber-300">{record.inviteCode}</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-purple-200/60 inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-cyan-300" /> Invitation Date
          </span>
          <span className="font-semibold text-white">{record.invitedDate}</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-purple-200/60 inline-flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-emerald-300" /> Invitation Method
          </span>
          <span className="font-semibold text-white">{record.method}</span>
        </div>

        <div className="pt-2 border-t border-white/10 space-y-1.5">
          <span className="text-purple-200/60 block">Invitation Link</span>
          <p className="font-mono text-[11px] text-pink-200 break-all bg-[#1B0B36] rounded-xl px-3 py-2 border border-purple-400/20">
            {record.inviteLink}
          </p>
        </div>
      </div>

      <p className="text-[11px] text-purple-200/55">
        Demo status shown for preview only — Popo Live does not claim server-verified invitation delivery or signup attribution in this frontend module.
      </p>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Button
          variant="secondary"
          size="sm"
          onClick={onBackMobile}
          className="lg:hidden"
        >
          Back to History
        </Button>

        <Button
          variant="primary"
          size="sm"
          data-testid="invite-detail-copy-link-btn"
          leftIcon={copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          onClick={handleCopy}
        >
          {copiedLink ? 'Link Copied' : 'Copy Invite Link'}
        </Button>
      </div>
    </div>
  );
};
