import React, { useState } from 'react';
import { X, Store, AlertTriangle, Save, CheckCircle2 } from 'lucide-react';
import { SellerRecord, SellerStatus } from './agencySellerPayoutTypes';

interface SellerStatusModalProps {
  seller: SellerRecord;
  isOpen: boolean;
  onClose: () => void;
  onSaveStatus: (sellerId: string, newStatus: SellerStatus, notes: string) => void;
}

export const SellerStatusModal: React.FC<SellerStatusModalProps> = ({
  seller,
  isOpen,
  onClose,
  onSaveStatus,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<SellerStatus>(seller.status);
  const [reviewNotes, setReviewNotes] = useState<string>(seller.reviewNotes || '');
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleConfirmSave = () => {
    onSaveStatus(seller.id, selectedStatus, reviewNotes);
    setShowConfirm(false);
    onClose();
  };

  const statusDescriptions: Record<SellerStatus, string> = {
    Active: 'Merchant or vendor account is fully authorized to fulfill coin orders and receive payout settlements.',
    Pending: 'Seller application or escrow deposit is undergoing compliance checks before authorization.',
    Inactive: 'Seller account is inactive due to prolonged inactivity or voluntary temporary pause.',
    Suspended: 'Seller account is suspended due to customer fulfillment complaints, delay in coin delivery, or dispute escalation.',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#190933] border border-purple-500/30 rounded-2xl p-6 shadow-2xl shadow-purple-950/50">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-purple-500/20 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-pink-500/20 border border-pink-500/30 text-pink-300">
              <Store className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Seller Status Management</h3>
              <p className="text-xs text-purple-300">
                {seller.name} (@{seller.username})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-purple-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Status Banner */}
        <div className="flex items-center justify-between p-3.5 bg-black/40 border border-purple-500/20 rounded-xl mb-5">
          <span className="text-xs font-medium text-purple-300">Current Merchant Status:</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              seller.status === 'Active'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : seller.status === 'Pending'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : seller.status === 'Suspended'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
            }`}
          >
            {seller.status}
          </span>
        </div>

        {/* Status Selector */}
        <div className="space-y-4 mb-5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-purple-300">
            Select New Status
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {(['Active', 'Pending', 'Inactive', 'Suspended'] as SellerStatus[]).map((status) => {
              const isSelected = selectedStatus === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setSelectedStatus(status)}
                  className={`p-3 rounded-xl border text-left text-sm font-medium transition cursor-pointer ${
                    isSelected
                      ? 'bg-pink-600/20 border-pink-500 text-white shadow-lg shadow-pink-500/10'
                      : 'bg-black/30 border-purple-500/20 text-purple-300 hover:bg-purple-900/20 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span>{status}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-pink-400" />}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-purple-300/80 bg-purple-950/40 p-3 rounded-xl border border-purple-500/20 leading-relaxed">
            {statusDescriptions[selectedStatus]}
          </p>
        </div>

        {/* Review Notes */}
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-purple-300 mb-2">
            Admin Review Notes & Reason
          </label>
          <textarea
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            rows={3}
            placeholder="Record justification, customer dispute notes, or compliance documentation..."
            className="w-full px-3.5 py-2.5 bg-black/40 border border-purple-500/30 rounded-xl text-sm text-white placeholder-purple-400/50 focus:outline-none focus:border-pink-500"
          />
        </div>

        {/* Disclaimer */}
        <p className="text-[11px] text-amber-300/80 mb-5 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Local demo state only. Live seller escrow balances remain untouched.</span>
        </p>

        {/* Confirmation & Buttons */}
        {showConfirm ? (
          <div className="p-4 bg-rose-950/30 border border-rose-500/30 rounded-xl">
            <p className="text-xs font-medium text-rose-200 mb-3">
              Confirm updating seller status to <span className="font-bold underline">{selectedStatus}</span>?
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-xs font-medium text-purple-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-medium text-xs shadow-lg shadow-pink-600/30"
              >
                Yes, Save Status
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-purple-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold text-sm hover:from-pink-600 hover:to-purple-700 transition shadow-lg shadow-pink-500/20 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save Demo Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
