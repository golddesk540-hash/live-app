'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Ban, Flag } from 'lucide-react';
import { InboxUserProfile } from './types';

interface ReportBlockModalProps {
  user: InboxUserProfile | null;
  mode: 'report' | 'block' | null;
  onClose: () => void;
  onConfirmBlock: (user: InboxUserProfile) => void;
  onConfirmReport: (user: InboxUserProfile, reason: string, alsoBlock: boolean) => void;
}

const REPORT_REASONS = [
  'Spam or unwanted promotional links',
  'Harassment or abusive language',
  'Impersonation or suspicious account',
  'Inappropriate media or scam request',
];

export const ReportBlockModal: React.FC<ReportBlockModalProps> = ({
  user,
  mode,
  onClose,
  onConfirmBlock,
  onConfirmReport,
}) => {
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [alsoBlock, setAlsoBlock] = useState(true);

  if (!user || !mode) return null;

  return (
    <Modal
      isOpen={Boolean(mode)}
      onClose={onClose}
      title={mode === 'block' ? `Block ${user.name}?` : `Report ${user.name}`}
      subtitle={`Popo ID: ${user.poppoId} • Local safety demo action`}
      maxWidth="sm"
      className="bg-[#120826] border-purple-400/25"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          {mode === 'block' ? (
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Ban className="w-3.5 h-3.5" />}
              onClick={() => {
                onConfirmBlock(user);
                onClose();
              }}
            >
              Confirm Block
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Flag className="w-3.5 h-3.5" />}
              onClick={() => {
                onConfirmReport(user, selectedReason, alsoBlock);
                onClose();
              }}
            >
              Submit Report
            </Button>
          )}
        </>
      }
    >
      {mode === 'block' ? (
        <div className="space-y-3 text-sm text-purple-100/80">
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/25">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
              Blocking <strong>{user.name}</strong> stops their messages and incoming requests inside your Inbox list locally.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-purple-200/70">Select a reason for reporting this message or profile:</p>
          <div className="space-y-2">
            {REPORT_REASONS.map((reason) => {
              const active = selectedReason === reason;
              return (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setSelectedReason(reason)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-semibold border transition-all ${
                    active
                      ? 'bg-[#FF1A6C]/20 border-[#FF1A6C] text-white'
                      : 'bg-[#1B0E35] border-white/10 text-purple-100/75 hover:border-white/25'
                  }`}
                >
                  {reason}
                </button>
              );
            })}
          </div>
          <label className="flex items-center gap-2 pt-1 text-xs text-purple-100/80 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={alsoBlock}
              onChange={(e) => setAlsoBlock(e.target.checked)}
              className="rounded border-white/20 accent-[#FF1A6C]"
            />
            <span>Also block messages from {user.name}</span>
          </label>
        </div>
      )}
    </Modal>
  );
};
