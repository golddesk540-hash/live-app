import React from 'react';
import {
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Building2,
  Store,
} from 'lucide-react';
import {
  PayoutRecord,
  AgencySellerPayoutMetrics,
  AgencySellerPayoutTab,
} from './agencySellerPayoutTypes';

interface PayoutDashboardViewProps {
  payouts: PayoutRecord[];
  metrics: AgencySellerPayoutMetrics;
  onNavigateTab: (tab: AgencySellerPayoutTab) => void;
  onOpenPayoutDetails: (payout: PayoutRecord) => void;
  onOpenReviewModal: (payout: PayoutRecord) => void;
}

export const PayoutDashboardView: React.FC<PayoutDashboardViewProps> = ({
  payouts,
  metrics,
  onNavigateTab,
  onOpenPayoutDetails,
  onOpenReviewModal,
}) => {
  // Breakdown percentages
  const total = metrics.totalPayoutRequests || 1;
  const pendingPct = Math.round((metrics.pendingPayoutRequests / total) * 100);
  const underReviewPct = Math.round((metrics.underReviewPayoutRequests / total) * 100);
  const approvedPct = Math.round((metrics.approvedPayoutRequests / total) * 100);
  const completedPct = Math.round((metrics.completedPayouts / total) * 100);
  const rejectedPct = Math.round((metrics.rejectedPayoutRequests / total) * 100);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-purple-500/20">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-pink-400" />
            Disbursement & Payout Dashboard
          </h2>
          <p className="text-xs text-purple-300 mt-1">
            Real-time pipeline overview for agency commissions, seller redemptions, and host settlements
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('payout_requests')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold text-xs shadow-lg shadow-pink-500/20 transition cursor-pointer"
        >
          <span>Open Full Requests Queue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-black/40 border border-purple-500/20">
          <p className="text-[10px] text-purple-400 uppercase font-semibold">Total Requests</p>
          <p className="text-2xl font-black text-white mt-1">{metrics.totalPayoutRequests}</p>
          <p className="text-[10px] text-purple-400/80 mt-0.5">Disbursement claims</p>
        </div>

        <div className="p-4 rounded-xl bg-black/40 border border-amber-500/20">
          <p className="text-[10px] text-amber-400 uppercase font-semibold">Pending Review</p>
          <p className="text-2xl font-black text-amber-300 mt-1">{metrics.pendingPayoutRequests}</p>
          <p className="text-[10px] text-amber-400/80 mt-0.5">Awaiting initial triage</p>
        </div>

        <div className="p-4 rounded-xl bg-black/40 border border-blue-500/20">
          <p className="text-[10px] text-blue-400 uppercase font-semibold">Under Review</p>
          <p className="text-2xl font-black text-blue-300 mt-1">{metrics.underReviewPayoutRequests}</p>
          <p className="text-[10px] text-blue-400/80 mt-0.5">Compliance checking</p>
        </div>

        <div className="p-4 rounded-xl bg-black/40 border border-emerald-500/20">
          <p className="text-[10px] text-emerald-400 uppercase font-semibold">Approved</p>
          <p className="text-2xl font-black text-emerald-300 mt-1">{metrics.approvedPayoutRequests}</p>
          <p className="text-[10px] text-emerald-400/80 mt-0.5">Batch settlement</p>
        </div>

        <div className="p-4 rounded-xl bg-black/40 border border-purple-500/20">
          <p className="text-[10px] text-purple-400 uppercase font-semibold">Completed</p>
          <p className="text-2xl font-black text-purple-300 mt-1">{metrics.completedPayouts}</p>
          <p className="text-[10px] text-purple-400/80 mt-0.5">Simulated finalized</p>
        </div>

        <div className="p-4 rounded-xl bg-black/40 border border-rose-500/20">
          <p className="text-[10px] text-rose-400 uppercase font-semibold">Rejected</p>
          <p className="text-2xl font-black text-rose-300 mt-1">{metrics.rejectedPayoutRequests}</p>
          <p className="text-[10px] text-rose-400/80 mt-0.5">Policy / disputes</p>
        </div>
      </div>

      {/* Financial Volume Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1d0a36] via-[#260e46] to-[#16072b] border border-purple-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-purple-300 font-semibold">
              Total Demo Payout Volume
            </span>
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">
              ${metrics.totalDemoPayoutAmountUsd.toLocaleString()}{' '}
              <span className="text-sm font-medium text-purple-300">USD</span>
            </p>
            <p className="text-xs text-purple-300/80 mt-1">
              Estimated: <strong>Rs {metrics.totalDemoPayoutAmountPkr.toLocaleString()} PKR</strong>
            </p>
          </div>

          <div className="pt-3 border-t border-purple-500/15 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-purple-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-pink-400" />
                Agencies Share:
              </span>
              <span className="font-semibold text-white">
                ${metrics.agencyPayoutAmountUsd.toLocaleString()} USD
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-purple-400 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-pink-400" />
                Sellers Share:
              </span>
              <span className="font-semibold text-white">
                ${metrics.sellerPayoutAmountUsd.toLocaleString()} USD
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/20 text-[11px] text-amber-300/80 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Simulated demo data. No real bank accounts or financial gateways connected.</span>
          </div>
        </div>

        {/* Payout Status Pipeline Overview Progress Bars */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#180930]/90 border border-purple-500/20 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-pink-400" />
              Payout Status Pipeline Breakdown
            </h3>
            <span className="text-xs text-purple-400">Total: {metrics.totalPayoutRequests} claims</span>
          </div>

          {/* Multi-segment Progress Bar */}
          <div className="h-4 w-full bg-black/60 rounded-full overflow-hidden flex border border-purple-500/20 p-0.5 gap-0.5">
            <div style={{ width: `${completedPct}%` }} className="bg-purple-500 h-full rounded-sm" title={`Completed: ${completedPct}%`} />
            <div style={{ width: `${approvedPct}%` }} className="bg-emerald-500 h-full rounded-sm" title={`Approved: ${approvedPct}%`} />
            <div style={{ width: `${underReviewPct}%` }} className="bg-blue-500 h-full rounded-sm" title={`Under Review: ${underReviewPct}%`} />
            <div style={{ width: `${pendingPct}%` }} className="bg-amber-500 h-full rounded-sm" title={`Pending: ${pendingPct}%`} />
            <div style={{ width: `${rejectedPct}%` }} className="bg-rose-500 h-full rounded-sm" title={`Rejected: ${rejectedPct}%`} />
          </div>

          {/* Pipeline Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/20 text-xs">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className="text-purple-300">Completed</span>
              </div>
              <p className="text-base font-bold text-white">{completedPct}%</p>
              <p className="text-[10px] text-purple-400">{metrics.completedPayouts} claims</p>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-xs">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-emerald-300">Approved</span>
              </div>
              <p className="text-base font-bold text-white">{approvedPct}%</p>
              <p className="text-[10px] text-emerald-400">{metrics.approvedPayoutRequests} claims</p>
            </div>

            <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/20 text-xs">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-blue-300">Under Review</span>
              </div>
              <p className="text-base font-bold text-white">{underReviewPct}%</p>
              <p className="text-[10px] text-blue-400">{metrics.underReviewPayoutRequests} claims</p>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/20 text-xs">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-amber-300">Pending</span>
              </div>
              <p className="text-base font-bold text-white">{pendingPct}%</p>
              <p className="text-[10px] text-amber-400">{metrics.pendingPayoutRequests} claims</p>
            </div>

            <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/20 text-xs">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-rose-300">Rejected</span>
              </div>
              <p className="text-base font-bold text-white">{rejectedPct}%</p>
              <p className="text-[10px] text-rose-400">{metrics.rejectedPayoutRequests} claims</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent High-Priority Payout Activity */}
      <div className="p-5 rounded-2xl bg-[#180930]/90 border border-purple-500/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-pink-400" />
            Recent Actionable Payout Claims
          </h3>
          <button
            onClick={() => onNavigateTab('payout_requests')}
            className="text-xs text-pink-400 hover:text-pink-300 font-medium flex items-center gap-1 cursor-pointer"
          >
            Inspect All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {payouts.slice(0, 5).map((payout) => (
            <div
              key={payout.id}
              className="flex items-center justify-between p-3.5 rounded-xl bg-black/30 border border-purple-500/15 hover:border-pink-500/30 transition"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-300">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">
                    #{payout.id} • {payout.accountName}{' '}
                    <span className="text-purple-400 font-normal">({payout.accountType})</span>
                  </p>
                  <p className="text-[11px] text-purple-300">
                    {payout.paymentMethodPlaceholder} • {payout.maskedAccountIdentifier}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-bold text-emerald-400">
                    ${payout.requestedDemoAmountUsd.toLocaleString()} USD
                  </p>
                  <p className="text-[10px] text-purple-400">{payout.requestDate}</p>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                    payout.status === 'Approved'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : payout.status === 'Under Review'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      : payout.status === 'Completed'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      : payout.status === 'Rejected'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {payout.status}
                </span>

                <button
                  onClick={() => onOpenReviewModal(payout)}
                  className="px-2.5 py-1 rounded-lg bg-pink-600/30 hover:bg-pink-600/50 border border-pink-500/40 text-white text-xs font-medium transition cursor-pointer"
                >
                  Adjudicate
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
