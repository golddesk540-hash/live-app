import React, { useState } from 'react';
import { X, CreditCard, AlertTriangle, Save, CheckCircle2, DollarSign } from 'lucide-react';
import { PayoutRecord, PayoutStatus } from './agencySellerPayoutTypes';

interface PayoutReviewModalProps {
  payout: PayoutRecord;
  isOpen: boolean;
  onClose: () => void;
  onSaveReview: (payoutId: string, newStatus: PayoutStatus, notes: string) => void;
}

export const PayoutReviewModal: React.FC<PayoutReviewModalProps> = ({
  payout,
  isOpen,
  onClose,
  onSaveReview,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<PayoutStatus>(payout.status);
  const [reviewNotes, setReviewNotes] = useState<string>(payout.reviewNotes || '');
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleConfirmSave = () => {
    onSaveReview(payout.id, selectedStatus, reviewNotes);
    setShowConfirm(false);
    onClose();
  };

  const statusDescriptions: Record<PayoutStatus, string> = {
    'Under Review': 'Mark for preliminary compliance, volume validation, and bank identifier verification.',
    Approved: 'Approve request for the next automated demo disbursement cycle.',
    Rejected: 'Decline request due to compliance flags, account mismatches, or dispute holds.',
    Completed: 'Mark demo disbursement as fully finalized and reconciled.',
    Pending: 'Reset back to the pending queue awaiting initial review.',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#190933] border border-purple-500/30 rounded-2xl p-6 shadow-2xl shadow-purple-950/50">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-purple-500/20 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300">
              <CreditCard className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Payout Review & Adjudication</h3>
              <p className="text-xs text-purple-300">
                Request #{payout.id} • {payout.accountName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-purple-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Payout Summary Info Box */}
        <div className="p-4 bg-black/40 border border-purple-500/20 rounded-xl mb-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-purple-300">Account Type & Holder:</span>
            <span className="font-semibold text-white">
              {payout.accountType} — {payout.accountHolderName}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-purple-300">Payment Gateway / Route:</span>
            <span className="font-medium text-pink-300">{payout.paymentMethodPlaceholder}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-purple-300">Masked Demo Identifier:</span>
            <span className="font-mono text-purple-200">{payout.maskedAccountIdentifier}</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-purple-500/10">
            <span className="text-purple-300">Requested Demo Amount:</span>
            <span className="text-sm font-bold text-emerald-400">
              ${payout.requestedDemoAmountUsd.toLocaleString()} USD ({payout.requestedDemoAmountPkr.toLocaleString()} PKR)
            </span>
          </div>
        </div>

        {/* Status Selector */}
        <div className="space-y-3 mb-5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-purple-300">
            Set Adjudication Status
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {(['Under Review', 'Approved', 'Rejected', 'Completed'] as PayoutStatus[]).map((status) => {
              const isSelected = selectedStatus === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setSelectedStatus(status)}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold transition cursor-pointer ${
                    isSelected
                      ? status === 'Approved'
                        ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-500/20'
                        : status === 'Rejected'
                        ? 'bg-rose-600/30 border-rose-500 text-rose-200 shadow-lg shadow-rose-500/20'
                        : status === 'Completed'
                        ? 'bg-purple-600/30 border-purple-500 text-purple-200 shadow-lg shadow-purple-500/20'
                        : 'bg-amber-600/30 border-amber-500 text-amber-200 shadow-lg shadow-amber-500/20'
                      : 'bg-black/30 border-purple-500/20 text-purple-300 hover:bg-purple-900/20 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span>{status}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-purple-300/80 bg-purple-950/40 p-2.5 rounded-xl border border-purple-500/20 leading-relaxed">
            {statusDescriptions[selectedStatus]}
          </p>
        </div>

        {/* Admin Review Notes */}
        <div className="mb-5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-purple-300 mb-2">
            Audit Review Notes
          </label>
          <textarea
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            rows={3}
            placeholder="Document verification checks, batch ID reference, or hold rationale..."
            className="w-full px-3.5 py-2.5 bg-black/40 border border-purple-500/30 rounded-xl text-sm text-white placeholder-purple-400/50 focus:outline-none focus:border-pink-500"
          />
        </div>

        {/* Financial Restriction Disclaimer */}
        <p className="text-[11px] text-amber-300/80 mb-5 flex items-center gap-1.5 bg-amber-950/30 p-2.5 rounded-xl border border-amber-500/20">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            <strong>IMPORTANT:</strong> Approved or Completed demo statuses do not trigger actual money transfers. This is simulated local frontend state.
          </span>
        </p>

        {/* Confirmation & Buttons */}
        {showConfirm ? (
          <div className="p-4 bg-rose-950/30 border border-rose-500/30 rounded-xl">
            <p className="text-xs font-medium text-rose-200 mb-3">
              Confirm marking payout #{payout.id} as <span className="font-bold underline">{selectedStatus}</span>?
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-xs font-medium text-purple-300 hover:text-white cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-medium text-xs shadow-lg shadow-pink-600/30 cursor-pointer"
              >
                Yes, Save Review
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-purple-300 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold text-sm hover:from-pink-600 hover:to-purple-700 transition shadow-lg shadow-pink-500/20 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save Demo Review
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
