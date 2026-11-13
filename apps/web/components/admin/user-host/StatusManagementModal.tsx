'use client';

import React, { useEffect, useState } from 'react';
import { AccountStatus } from './userHostTypes';

interface StatusManagementModalProps {
  isOpen: boolean;
  targetType: 'user' | 'host';
  targetId: string;
  targetName: string;
  targetAvatar: string;
  currentStatus: AccountStatus;
  onClose: () => void;
  onSaveStatus: (targetId: string, nextStatus: AccountStatus, reason: string) => void;
}

const STATUS_DESCRIPTIONS: Record<AccountStatus, string> = {
  Active: 'Normal platform access. The account can broadcast, enter rooms, and participate in social features.',
  Pending: 'Account or creator onboarding is under review. Elevated features are restricted pending approval.',
  Inactive: 'Account is dormant. Can be restored upon user login or manual administrative activation.',
  Suspended: 'Access blocked due to guideline violations or security flags. User cannot enter rooms or stream.',
};

export const StatusManagementModal: React.FC<StatusManagementModalProps> = ({
  isOpen,
  targetType,
  targetId,
  targetName,
  targetAvatar,
  currentStatus,
  onClose,
  onSaveStatus,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<AccountStatus>(currentStatus);
  const [reason, setReason] = useState<string>('');
  const [confirmed, setConfirmed] = useState<boolean>(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  useEffect(() => {
    setSelectedStatus(currentStatus);
    setReason('');
    setConfirmed(false);
    setErrorNotice(null);
  }, [currentStatus, isOpen]);

  if (!isOpen) return null;

  const isChanging = selectedStatus !== currentStatus;
  const isSuspension = selectedStatus === 'Suspended';

  const handleSave = () => {
    if (!isChanging) {
      setErrorNotice('Please select a different status to apply.');
      return;
    }
    if (!reason.trim()) {
      setErrorNotice('Please provide a reason or administrative note.');
      return;
    }
    if (isSuspension && !confirmed) {
      setErrorNotice('Please confirm the suspension checkbox before proceeding.');
      return;
    }

    onSaveStatus(targetId, selectedStatus, reason.trim());
    onClose();
  };

  const statusOptions: AccountStatus[] = ['Active', 'Pending', 'Inactive', 'Suspended'];

  return (
    <div
      id="status-management-modal"
      data-testid="status-management-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div className="w-full max-w-lg rounded-3xl bg-[#160A2D] border border-purple-500/30 shadow-[0_0_50px_rgba(255,15,123,0.3)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0E061E]/90 border-b border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-pink-500 shadow-[0_0_10px_#FF0F7B]" />
            <div>
              <h3 className="text-base font-bold text-white">
                {targetType === 'host' ? 'Host Status Management' : 'User Account Status'}
              </h3>
              <p className="text-xs text-zinc-400">
                Administrative standing controls & standing audit record
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh] custom-scrollbar">
          {errorNotice && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errorNotice}</span>
            </div>
          )}

          {/* Target Profile Card */}
          <div className="p-3.5 rounded-2xl bg-[#0E061E]/80 border border-purple-500/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={targetAvatar}
                alt={targetName}
                className="w-12 h-12 rounded-2xl object-cover border border-purple-500/30"
              />
              <div>
                <div className="text-sm font-bold text-white">{targetName}</div>
                <div className="text-xs text-zinc-400 font-mono">ID: {targetId}</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-400 block mb-0.5">Current Status</span>
              <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                {currentStatus}
              </span>
            </div>
          </div>

          {/* New Status Select Pills */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300">Select New Standing</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {statusOptions.map((st) => {
                const isSelected = selectedStatus === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setSelectedStatus(st);
                      setErrorNotice(null);
                    }}
                    className={`py-2 px-3 rounded-2xl text-xs font-bold border transition-all ${
                      isSelected
                        ? st === 'Suspended'
                          ? 'bg-rose-600 text-white border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                          : st === 'Active'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-[0_0_15px_rgba(52,211,153,0.4)]'
                          : 'bg-pink-500 text-white border-pink-400 shadow-[0_0_15px_rgba(255,15,123,0.4)]'
                        : 'bg-[#0E061E]/80 text-zinc-400 border-purple-500/20 hover:border-purple-500/40 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-zinc-400 pt-1 leading-relaxed">
              {STATUS_DESCRIPTIONS[selectedStatus]}
            </p>
          </div>

          {/* Suspension Warning Box */}
          {isSuspension && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2 font-bold text-rose-300">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Warning: Account Suspension</span>
              </div>
              <p className="text-zinc-300 leading-relaxed text-[11px]">
                Suspending this account will immediately revoke broad administrative access, terminate active broadcasts, and block user login until restored.
              </p>
              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-500 bg-[#0E061E] border-rose-500/40 focus:ring-rose-500"
                />
                <span className="text-[11px] font-semibold text-rose-200">
                  I understand this demo suspension action and wish to apply it
                </span>
              </label>
            </div>
          )}

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Administrative Reason / Log Note <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Identity review approved; Chat policy violation (Ref: INC-4029)..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#0E061E] border border-purple-500/25 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-pink-500"
            />
          </div>

          <div className="p-3 rounded-2xl bg-[#0E061E]/60 border border-purple-500/15 text-[11px] text-zinc-400">
            <strong>Frontend Demo Notice:</strong> Changes are saved to local React state and audit trail. No real production accounts are affected.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#0E061E]/90 border-t border-purple-500/20 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isChanging}
            className="px-5 py-2 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-[0_0_15px_rgba(255,15,123,0.3)] transition-all"
          >
            Save Demo Change
          </button>
        </div>
      </div>
    </div>
  );
};
