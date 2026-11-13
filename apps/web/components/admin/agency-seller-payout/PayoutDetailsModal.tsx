import React from 'react';
import {
  X,
  CreditCard,
  Building2,
  Store,
  User,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Edit3,
} from 'lucide-react';
import { PayoutRecord } from './agencySellerPayoutTypes';

interface PayoutDetailsModalProps {
  payout: PayoutRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenReview: (payout: PayoutRecord) => void;
}

export const PayoutDetailsModal: React.FC<PayoutDetailsModalProps> = ({
  payout,
  isOpen,
  onClose,
  onOpenReview,
}) => {
  if (!isOpen || !payout) return null;

  const statusBadge = () => {
    switch (payout.status) {
      case 'Approved':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Completed':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Under Review':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Rejected':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#17082e] border border-purple-500/30 rounded-2xl p-6 shadow-2xl shadow-purple-950/60 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-purple-500/20 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-600/30 to-pink-600/30 border border-purple-500/30">
              <CreditCard className="w-6 h-6 text-pink-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <h2 className="text-xl font-bold text-white">Payout Request #{payout.id}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadge()}`}>
                  {payout.status}
                </span>
              </div>
              <p className="text-xs text-purple-300">
                Created on {payout.requestDate} • Last Updated {payout.lastUpdated}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenReview(payout)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-xs font-semibold text-white shadow-lg shadow-pink-500/20 transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Adjudicate
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-purple-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Amount Hero Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/60 via-pink-950/40 to-purple-950/60 border border-purple-500/30 mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-purple-300 font-semibold mb-1">
              Disbursement Demo Amount
            </p>
            <p className="text-2xl md:text-3xl font-extrabold text-white">
              ${payout.requestedDemoAmountUsd.toLocaleString()}{' '}
              <span className="text-xs font-normal text-emerald-400">USD</span>
            </p>
            <p className="text-xs text-purple-300/80 mt-1">
              Equivalent: <strong>Rs {payout.requestedDemoAmountPkr.toLocaleString()} PKR</strong> (Simulated demo rate)
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-purple-400 block mb-1">Account Category</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-900/40 border border-purple-500/30 text-xs font-medium text-pink-300">
              {payout.accountType === 'Agency' ? (
                <Building2 className="w-3.5 h-3.5" />
              ) : payout.accountType === 'Coin Seller' ? (
                <Store className="w-3.5 h-3.5" />
              ) : (
                <User className="w-3.5 h-3.5" />
              )}
              {payout.accountType}
            </span>
          </div>
        </div>

        {/* Account & Payment Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-black/40 border border-purple-500/20">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-300 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-pink-400" />
              Beneficiary Entity
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-purple-400">Account Name:</span>
                <span className="text-white font-medium">{payout.accountName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-purple-400">Account ID:</span>
                <span className="font-mono text-purple-200">{payout.accountId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-purple-400">Account Holder:</span>
                <span className="text-white">{payout.accountHolderName}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-purple-500/20">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-300 mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-pink-400" />
              Payment Method Placeholder
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-purple-400">Method:</span>
                <span className="text-pink-300 font-medium">{payout.paymentMethodPlaceholder}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-purple-400">Identifier:</span>
                <span className="font-mono text-purple-200">{payout.maskedAccountIdentifier}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-purple-400">Credentials:</span>
                <span className="text-[11px] text-amber-400/90 italic">Simulated masked placeholder</span>
              </div>
            </div>
          </div>
        </div>

        {/* Review Notes & Audit Info */}
        <div className="p-4 rounded-xl bg-black/30 border border-purple-500/20 mb-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-300 mb-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-pink-400" />
            Audit Notes & Review Status
          </h4>
          <p className="text-xs text-purple-200/90 leading-relaxed mb-3">
            {payout.reviewNotes || 'No administrative review notes recorded yet.'}
          </p>
          {payout.reviewedBy && (
            <p className="text-[11px] text-purple-400 pt-2 border-t border-purple-500/10">
              Reviewed by <strong>{payout.reviewedBy}</strong> on {payout.reviewedAt}
            </p>
          )}
        </div>

        {/* Timeline */}
        <div className="mb-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-300 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-pink-400" />
            Disbursement Activity Timeline
          </h4>
          {payout.timeline.length === 0 ? (
            <p className="text-xs text-purple-400/80 italic p-3 bg-black/30 rounded-xl border border-purple-500/10">
              Request submitted; awaiting adjudication.
            </p>
          ) : (
            <div className="space-y-2.5">
              {payout.timeline.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-black/20 border border-purple-500/15"
                >
                  <div className="p-1 rounded-full bg-pink-500/20 text-pink-400 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{item.title}</span>
                      <span className="text-[10px] text-purple-400">{item.date}</span>
                    </div>
                    <p className="text-[11px] text-purple-300 mt-0.5">
                      Actor: <span className="text-pink-300">{item.actor}</span>
                      {item.note && ` — ${item.note}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-5 border-t border-purple-500/20">
          <span className="text-[11px] text-amber-400/80 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            No actual bank transfer is executed.
          </span>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 font-medium text-xs transition cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => onOpenReview(payout)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold text-xs shadow-lg shadow-pink-500/20 transition cursor-pointer"
            >
              Update Payout Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
