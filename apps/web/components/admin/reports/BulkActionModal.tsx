'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  RotateCcw,
  ShieldAlert,
  X,
  XCircle,
} from 'lucide-react';
import { ReportStatus } from './reportQueueTypes';

interface BulkActionModalProps {
  selectedCount: number;
  isOpen: boolean;
  onClose: () => void;
  onApplyBulkAction: (status: ReportStatus, note: string) => void;
}

export const BulkActionModal: React.FC<BulkActionModalProps> = ({
  selectedCount,
  isOpen,
  onClose,
  onApplyBulkAction,
}) => {
  if (!isOpen) return null;

  const [targetStatus, setTargetStatus] = useState<ReportStatus>('Under Review');
  const [note, setNote] = useState<string>('Batch disposition applied by admin.');
  const [confirmed, setConfirmed] = useState<boolean>(false);

  const options: {
    status: ReportStatus;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }[] = [
    {
      status: 'Under Review',
      label: 'Move to Under Review',
      icon: Clock,
      color: 'border-purple-500/40 text-purple-300 bg-purple-500/10',
    },
    {
      status: 'Resolved',
      label: 'Batch Resolve',
      icon: CheckCircle2,
      color: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10',
    },
    {
      status: 'Rejected',
      label: 'Batch Reject / Dismiss',
      icon: XCircle,
      color: 'border-rose-500/40 text-rose-300 bg-rose-500/10',
    },
    {
      status: 'Pending',
      label: 'Reset to Pending',
      icon: RotateCcw,
      color: 'border-amber-500/40 text-amber-300 bg-amber-500/10',
    },
  ];

  const handleExecute = () => {
    onApplyBulkAction(targetStatus, note);
    setConfirmed(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#120A2A] border border-pink-500/30 rounded-2xl shadow-[0_0_50px_rgba(255,15,123,0.25)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1A103C]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Bulk Report Action</h3>
              <p className="text-[11px] text-gray-400">
                Applying to <span className="text-pink-400 font-bold">{selectedCount}</span> selected reports
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-2">
              Select Batch Disposition
            </label>
            <div className="space-y-2">
              {options.map((opt) => {
                const isSelected = targetStatus === opt.status;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.status}
                    type="button"
                    onClick={() => setTargetStatus(opt.status)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? `${opt.color} ring-2 ring-pink-500 shadow-md`
                        : 'border-white/10 bg-white/[0.02] text-gray-400 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-bold text-white">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Batch Audit Note
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[#0B0716] border border-white/15 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
            />
          </div>

          {confirmed ? (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
              <div className="flex items-center gap-2 font-bold mb-1">
                <AlertCircle className="w-4 h-4 text-amber-400" /> Confirm Batch Update
              </div>
              <p className="text-[11px] leading-relaxed">
                Confirming will update {selectedCount} reports to <strong>{targetStatus}</strong> in local state.
              </p>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#1A103C] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
          >
            Cancel
          </button>
          {confirmed ? (
            <button
              onClick={handleExecute}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-lg"
            >
              Execute Bulk Update
            </button>
          ) : (
            <button
              onClick={() => setConfirmed(true)}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-pink-500 hover:bg-pink-600 shadow-md"
            >
              Confirm Batch Action
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
