import React from 'react';
import {
  X,
  Store,
  Coins,
  DollarSign,
  Package,
  Clock,
  Star,
  Globe,
  Mail,
  Phone,
  Edit3,
  CreditCard,
} from 'lucide-react';
import { SellerRecord } from './agencySellerPayoutTypes';

interface SellerDetailsModalProps {
  seller: SellerRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onEditStatus: (seller: SellerRecord) => void;
  onViewPayout?: (payoutId: string) => void;
}

export const SellerDetailsModal: React.FC<SellerDetailsModalProps> = ({
  seller,
  isOpen,
  onClose,
  onEditStatus,
  onViewPayout,
}) => {
  if (!isOpen || !seller) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#17082e] border border-purple-500/30 rounded-2xl p-6 shadow-2xl shadow-purple-950/60 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-purple-500/20 mb-6">
          <div className="flex items-center gap-4">
            <img
              src={seller.avatar}
              alt={seller.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-pink-500/40 shadow-lg shadow-pink-500/20"
            />
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <h2 className="text-xl font-bold text-white">{seller.name}</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
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
              <p className="text-xs text-purple-300 flex items-center gap-2">
                <span className="font-semibold text-pink-400">@{seller.username}</span>
                <span>•</span>
                <span className="font-mono bg-purple-900/40 px-2 py-0.5 rounded border border-purple-500/20">
                  {seller.id}
                </span>
                <span>• {seller.sellerType}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEditStatus(seller)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 text-xs font-medium text-purple-200 transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-pink-400" />
              Edit Status
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-purple-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Demo Sales Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-3.5 rounded-xl bg-black/40 border border-amber-500/20">
            <p className="text-[11px] text-amber-400 mb-1 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" />
              Coins Sold
            </p>
            <p className="text-lg font-bold text-white">{seller.totalCoinsSold.toLocaleString()}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-black/40 border border-pink-500/20">
            <p className="text-[11px] text-pink-400 mb-1 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" />
              Demo Sales
            </p>
            <p className="text-lg font-bold text-pink-300">
              ${seller.totalDemoSalesAmountUsd.toLocaleString()}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-black/40 border border-purple-500/20">
            <p className="text-[11px] text-purple-400 mb-1 flex items-center gap-1">
              <Package className="w-3.5 h-3.5" />
              Total Orders
            </p>
            <p className="text-lg font-bold text-white">{seller.totalOrders}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/20">
            <p className="text-[11px] text-emerald-400 mb-1 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
              Satisfaction
            </p>
            <p className="text-lg font-bold text-emerald-300">{seller.rating ? `${seller.rating} / 5.0` : 'N/A'}</p>
          </div>
        </div>

        {/* Order Fulfillment Breakdown */}
        <div className="p-4 rounded-xl bg-black/30 border border-purple-500/20 mb-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-300 mb-3 flex items-center justify-between">
            <span>Order Fulfillment Breakdown</span>
            <span className="text-[11px] text-purple-400 font-normal">Registered: {seller.registeredAt}</span>
          </h4>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2.5 rounded-lg bg-purple-950/40 border border-purple-500/20">
              <p className="text-[10px] text-purple-400 uppercase">Total Orders</p>
              <p className="text-base font-bold text-white">{seller.totalOrders}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/20">
              <p className="text-[10px] text-amber-400 uppercase">Pending Orders</p>
              <p className="text-base font-bold text-amber-300">{seller.pendingOrders}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20">
              <p className="text-[10px] text-emerald-400 uppercase">Completed</p>
              <p className="text-base font-bold text-emerald-300">{seller.completedOrders}</p>
            </div>
          </div>
        </div>

        {/* Contact & Region */}
        <div className="p-4 rounded-xl bg-black/40 border border-purple-500/20 mb-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-300 mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-pink-400" />
            Merchant Profile & Contact
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-purple-300/90">
            <div>
              <span className="text-purple-400 block text-[10px] uppercase">Region / Territory</span>
              <span className="font-medium text-white">{seller.region}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="truncate">{seller.contactEmail}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>{seller.contactPhone}</span>
            </div>
          </div>
        </div>

        {/* Related Payout Records */}
        <div className="mb-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-300 mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-pink-400" />
            Related Payout Dispatches ({seller.relatedPayoutIds.length})
          </h4>
          {seller.relatedPayoutIds.length === 0 ? (
            <p className="text-xs text-purple-400/80 italic p-3 bg-black/30 rounded-xl border border-purple-500/10">
              No historical payout requests found for this seller.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {seller.relatedPayoutIds.map((pid) => (
                <button
                  key={pid}
                  onClick={() => onViewPayout && onViewPayout(pid)}
                  className="px-3 py-1.5 rounded-lg bg-pink-950/30 hover:bg-pink-900/50 border border-pink-500/30 text-xs font-mono text-pink-300 transition cursor-pointer"
                >
                  #{pid}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Activity & Compliance Notes */}
        <div className="p-4 rounded-xl bg-black/30 border border-purple-500/20">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-300 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-pink-400" />
            Recent Seller Activity & Review Notes
          </h4>
          <p className="text-xs text-purple-200/90 leading-relaxed mb-3">
            {seller.reviewNotes || 'Standard merchant record in good standing.'}
          </p>
          {seller.activityHistory && seller.activityHistory.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-purple-500/10">
              {seller.activityHistory.map((act) => (
                <div key={act.id} className="text-[11px] text-purple-300 flex items-center justify-between">
                  <span>
                    <strong className="text-white">{act.title}</strong> — {act.description}
                  </span>
                  <span className="text-purple-400 text-[10px]">{act.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-5 border-t border-purple-500/20 mt-6">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 font-medium text-xs transition cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
