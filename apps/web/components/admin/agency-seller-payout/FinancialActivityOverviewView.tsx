import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Building2,
  Store,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
  Calendar,
} from 'lucide-react';
import {
  AgencySellerPayoutMetrics,
  MonthlyPayoutChartPoint,
  AdminReviewActivityItem,
  PayoutRecord,
} from './agencySellerPayoutTypes';
import { MONTHLY_PAYOUT_CHART } from './mockAgencySellerPayoutData';

interface FinancialActivityOverviewViewProps {
  metrics: AgencySellerPayoutMetrics;
  recentPayouts: PayoutRecord[];
  onOpenPayoutDetails: (payout: PayoutRecord) => void;
}

export const FinancialActivityOverviewView: React.FC<FinancialActivityOverviewViewProps> = ({
  metrics,
  recentPayouts,
  onOpenPayoutDetails,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'6m' | '1y'>('6m');

  const maxVal = Math.max(...MONTHLY_PAYOUT_CHART.map((p) => p.totalPayouts), 80000);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-purple-500/20">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-pink-400" />
            Financial Activity & Payout Overview
          </h2>
          <p className="text-xs text-purple-300 mt-1">
            Simulated economic metrics, partner disbursement distributions, and volume projections
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-1 bg-black/40 border border-purple-500/30 rounded-xl flex items-center text-xs">
            <button
              onClick={() => setSelectedPeriod('6m')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                selectedPeriod === '6m' ? 'bg-pink-600 text-white' : 'text-purple-300 hover:text-white'
              }`}
            >
              Last 6 Months
            </button>
            <button
              onClick={() => setSelectedPeriod('1y')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                selectedPeriod === '1y' ? 'bg-pink-600 text-white' : 'text-purple-300 hover:text-white'
              }`}
            >
              Full Year 2026
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Agency Summary */}
        <div className="p-4 rounded-xl bg-black/40 border border-purple-500/20">
          <p className="text-[10px] text-purple-400 uppercase font-semibold flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-pink-400" />
            Agency Demo Payouts
          </p>
          <p className="text-xl font-extrabold text-white mt-1">
            ${metrics.agencyPayoutAmountUsd.toLocaleString()} USD
          </p>
          <p className="text-[10px] text-purple-400 mt-0.5">
            Guild host commissions
          </p>
        </div>

        {/* Seller Summary */}
        <div className="p-4 rounded-xl bg-black/40 border border-purple-500/20">
          <p className="text-[10px] text-purple-400 uppercase font-semibold flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-pink-400" />
            Seller Demo Payouts
          </p>
          <p className="text-xl font-extrabold text-white mt-1">
            ${metrics.sellerPayoutAmountUsd.toLocaleString()} USD
          </p>
          <p className="text-[10px] text-purple-400 mt-0.5">
            Coin merchant redemptions
          </p>
        </div>

        {/* Pending Amount */}
        <div className="p-4 rounded-xl bg-black/40 border border-amber-500/20">
          <p className="text-[10px] text-amber-400 uppercase font-semibold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Pending Volume
          </p>
          <p className="text-xl font-extrabold text-amber-300 mt-1">
            ${metrics.pendingPayoutAmountUsd.toLocaleString()} USD
          </p>
          <p className="text-[10px] text-amber-400/80 mt-0.5">
            Awaiting final approval
          </p>
        </div>

        {/* Approved Amount */}
        <div className="p-4 rounded-xl bg-black/40 border border-emerald-500/20">
          <p className="text-[10px] text-emerald-400 uppercase font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Approved Volume
          </p>
          <p className="text-xl font-extrabold text-emerald-300 mt-1">
            ${metrics.approvedPayoutAmountUsd.toLocaleString()} USD
          </p>
          <p className="text-[10px] text-emerald-400/80 mt-0.5">
            Queued for next batch
          </p>
        </div>

        {/* Completed Amount */}
        <div className="p-4 rounded-xl bg-black/40 border border-purple-500/20">
          <p className="text-[10px] text-purple-400 uppercase font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
            Completed Volume
          </p>
          <p className="text-xl font-extrabold text-purple-300 mt-1">
            ${metrics.completedPayoutAmountUsd.toLocaleString()} USD
          </p>
          <p className="text-[10px] text-purple-400 mt-0.5">
            Disbursed in demo state
          </p>
        </div>
      </div>

      {/* Monthly Chart and Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Bar Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#180930]/90 border border-purple-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-pink-400" />
                Monthly Demo Payout Trend (USD)
              </h3>
              <p className="text-[11px] text-purple-400 mt-0.5">
                Simulated comparative volume: Agency vs Coin Seller payouts
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-purple-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-purple-500 inline-block" />
                Agency
              </span>
              <span className="flex items-center gap-1 text-pink-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-pink-500 inline-block" />
                Seller
              </span>
            </div>
          </div>

          {/* SVG Visual */}
          <div className="pt-6">
            <div className="h-56 flex items-end justify-between gap-4 px-2 border-b border-purple-500/20 pb-2">
              {MONTHLY_PAYOUT_CHART.map((point) => {
                const agencyHeightPct = Math.round((point.agencyPayouts / maxVal) * 100);
                const sellerHeightPct = Math.round((point.sellerPayouts / maxVal) * 100);

                return (
                  <div key={point.month} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] text-purple-300 font-mono font-medium">
                      ${((point.agencyPayouts + point.sellerPayouts) / 1000).toFixed(0)}k
                    </span>
                    <div className="w-full max-w-[42px] flex items-end gap-1 h-44">
                      {/* Agency Bar */}
                      <div
                        style={{ height: `${agencyHeightPct}%` }}
                        className="flex-1 bg-gradient-to-t from-purple-700 to-purple-500 rounded-t-md hover:brightness-125 transition"
                        title={`Agency: $${point.agencyPayouts.toLocaleString()}`}
                      />
                      {/* Seller Bar */}
                      <div
                        style={{ height: `${sellerHeightPct}%` }}
                        className="flex-1 bg-gradient-to-t from-pink-700 to-pink-500 rounded-t-md hover:brightness-125 transition"
                        title={`Seller: $${point.sellerPayouts.toLocaleString()}`}
                      />
                    </div>
                    <span className="text-xs font-semibold text-purple-300">{point.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Currency & Financial Simulation Disclaimers */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1d0a36] via-[#240d42] to-[#16072b] border border-purple-500/30 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Simulated Frontend Financials
              </h4>
            </div>
            <p className="text-xs text-purple-200/90 leading-relaxed mb-4">
              All metrics, currency conversions, host cuts, and seller redemption amounts displayed in Module 10.7 are generated from local frontend demo models.
            </p>

            <div className="space-y-2 text-xs bg-black/40 p-3 rounded-xl border border-purple-500/20">
              <div className="flex items-center justify-between">
                <span className="text-purple-400">Simulation Conversion Rate:</span>
                <span className="font-mono text-white">1 USD = 280 PKR</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-purple-400">Host Point Valuation:</span>
                <span className="font-mono text-white">1,000 pts = $1.00 USD</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-purple-400">Coin Merchant Escrow:</span>
                <span className="font-mono text-emerald-400">Mock Escrow Enabled</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-500/20 text-[11px] text-purple-300">
            No real banking credentials or live payment gateways (e.g. Stripe, PayPal, IBAN gateways) are connected.
          </div>
        </div>
      </div>

      {/* Recent High-Volume Disbursements */}
      <div className="p-5 rounded-2xl bg-[#180930]/90 border border-purple-500/20">
        <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          Recent High-Volume Disbursement Records
        </h3>

        <div className="space-y-2">
          {recentPayouts.slice(0, 6).map((payout) => (
            <div
              key={payout.id}
              className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-purple-500/15"
            >
              <div>
                <p className="text-xs font-bold text-white">
                  #{payout.id} • {payout.accountName}
                </p>
                <p className="text-[11px] text-purple-400">
                  {payout.paymentMethodPlaceholder} • {payout.accountType}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs font-bold text-emerald-400">
                    ${payout.requestedDemoAmountUsd.toLocaleString()} USD
                  </p>
                  <p className="text-[10px] text-purple-400">{payout.requestDate}</p>
                </div>

                <button
                  onClick={() => onOpenPayoutDetails(payout)}
                  className="px-2.5 py-1 rounded-lg bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 text-xs font-medium transition cursor-pointer"
                >
                  Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
