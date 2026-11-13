import React from 'react';
import {
  Building2,
  Store,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Shield,
  DollarSign,
  Users,
  ChevronRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  AgencyRecord,
  SellerRecord,
  PayoutRecord,
  AdminReviewActivityItem,
  AgencySellerPayoutMetrics,
  AgencySellerPayoutTab,
} from './agencySellerPayoutTypes';

interface AgencySellerPayoutDashboardViewProps {
  agencies: AgencyRecord[];
  sellers: SellerRecord[];
  payouts: PayoutRecord[];
  activities: AdminReviewActivityItem[];
  metrics: AgencySellerPayoutMetrics;
  onNavigateTab: (tab: AgencySellerPayoutTab) => void;
  onOpenAgencyDetails: (agency: AgencyRecord) => void;
  onOpenSellerDetails: (seller: SellerRecord) => void;
  onOpenPayoutDetails: (payout: PayoutRecord) => void;
}

export const AgencySellerPayoutDashboardView: React.FC<AgencySellerPayoutDashboardViewProps> = ({
  agencies,
  sellers,
  payouts,
  activities,
  metrics,
  onNavigateTab,
  onOpenAgencyDetails,
  onOpenSellerDetails,
  onOpenPayoutDetails,
}) => {
  // Hub items matching 10_07 visual reference
  const agencyAlpha = agencies.find((a) => a.id === 'AG1001') || agencies[0];
  const agencyPrime = agencies.find((a) => a.id === 'AG1002') || agencies[1];
  const sellerRahul = sellers.find((s) => s.id === 'SL2001') || sellers[0];
  const payoutPys8421 = payouts.find((p) => p.id === 'PYS-8421') || payouts[0];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1e0838] via-[#2d0f52] to-[#1a0731] border border-purple-500/30 p-6 md:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Enterprise Guild & Partner Management • Module 10.7</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">
              Agency, Seller, Payout Admin
            </h1>
            <p className="text-purple-200/80 text-sm leading-relaxed">
              Unified administration center for host agency networks, authorized coin resellers, and simulated partner disbursement queues with audit review tracking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('payout_requests')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold text-xs shadow-lg shadow-pink-500/25 transition cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              Review Payouts ({metrics.pendingPayoutRequests + metrics.underReviewPayoutRequests})
            </button>
            <button
              onClick={() => onNavigateTab('financial_overview')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/50 border border-purple-500/30 text-purple-200 font-medium text-xs transition cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 text-pink-400" />
              Financial Overview
            </button>
          </div>
        </div>
      </div>

      {/* Primary Visual Hub Cards matching 10_07 visual reference */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-purple-200 flex items-center gap-2">
            <Shield className="w-4 h-4 text-pink-400" />
            Core Operational Hub Cards (10_07 Reference)
          </h2>
          <span className="text-xs text-purple-400">Click any card to inspect details</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Agency Alpha */}
          {agencyAlpha && (
            <div
              onClick={() => onOpenAgencyDetails(agencyAlpha)}
              className="group p-4 rounded-2xl bg-[#1a0b33]/90 hover:bg-[#230f44] border border-purple-500/25 hover:border-pink-500/50 transition-all duration-200 cursor-pointer shadow-lg shadow-purple-950/40 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-full bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 shadow-md">
                  <Users className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {agencyAlpha.status}
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-pink-300 transition">
                {agencyAlpha.name}
              </h3>
              <p className="text-xs text-purple-300 font-mono mt-0.5">ID: {agencyAlpha.id}</p>
              <div className="mt-3 pt-3 border-t border-purple-500/15 flex items-center justify-between text-xs text-purple-300/80">
                <span>{agencyAlpha.totalHosts} Hosts</span>
                <span className="text-pink-400 font-medium group-hover:translate-x-1 transition flex items-center gap-0.5">
                  Inspect <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          )}

          {/* Card 2: Agency Prime */}
          {agencyPrime && (
            <div
              onClick={() => onOpenAgencyDetails(agencyPrime)}
              className="group p-4 rounded-2xl bg-[#1a0b33]/90 hover:bg-[#230f44] border border-purple-500/25 hover:border-pink-500/50 transition-all duration-200 cursor-pointer shadow-lg shadow-purple-950/40 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-full bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300 shadow-md">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {agencyPrime.status}
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-pink-300 transition">
                {agencyPrime.name}
              </h3>
              <p className="text-xs text-purple-300 font-mono mt-0.5">ID: {agencyPrime.id}</p>
              <div className="mt-3 pt-3 border-t border-purple-500/15 flex items-center justify-between text-xs text-purple-300/80">
                <span>{agencyPrime.totalHosts} Hosts</span>
                <span className="text-pink-400 font-medium group-hover:translate-x-1 transition flex items-center gap-0.5">
                  Inspect <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          )}

          {/* Card 3: Seller_Rahul */}
          {sellerRahul && (
            <div
              onClick={() => onOpenSellerDetails(sellerRahul)}
              className="group p-4 rounded-2xl bg-[#1a0b33]/90 hover:bg-[#230f44] border border-purple-500/25 hover:border-pink-500/50 transition-all duration-200 cursor-pointer shadow-lg shadow-purple-950/40 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-full bg-pink-600/30 border border-pink-400/40 flex items-center justify-center text-pink-300 shadow-md">
                  <Store className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {sellerRahul.status}
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-pink-300 transition">
                {sellerRahul.username}
              </h3>
              <p className="text-xs text-purple-300 font-mono mt-0.5">ID: {sellerRahul.id}</p>
              <div className="mt-3 pt-3 border-t border-purple-500/15 flex items-center justify-between text-xs text-purple-300/80">
                <span>${sellerRahul.totalDemoSalesAmountUsd.toLocaleString()} Sales</span>
                <span className="text-pink-400 font-medium group-hover:translate-x-1 transition flex items-center gap-0.5">
                  Inspect <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          )}

          {/* Card 4: Payout Request #PYS-8421 */}
          {payoutPys8421 && (
            <div
              onClick={() => onOpenPayoutDetails(payoutPys8421)}
              className="group p-4 rounded-2xl bg-[#1a0b33]/90 hover:bg-[#230f44] border border-purple-500/25 hover:border-pink-500/50 transition-all duration-200 cursor-pointer shadow-lg shadow-purple-950/40 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-full bg-amber-600/30 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-md">
                  <CreditCard className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Processing
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-pink-300 transition">
                Payout Request
              </h3>
              <p className="text-xs text-purple-300 font-mono mt-0.5">#{payoutPys8421.id}</p>
              <div className="mt-3 pt-3 border-t border-purple-500/15 flex items-center justify-between text-xs text-purple-300/80">
                <span>${payoutPys8421.requestedDemoAmountUsd.toLocaleString()} USD</span>
                <span className="text-pink-400 font-medium group-hover:translate-x-1 transition flex items-center gap-0.5">
                  Adjudicate <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comprehensive KPI Metric Row matching underlying records */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-purple-200 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-pink-400" />
          Platform Key Performance Indicators
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="p-3.5 rounded-xl bg-black/40 border border-purple-500/20">
            <span className="text-[10px] text-purple-400 block uppercase font-medium">Total Agencies</span>
            <span className="text-xl font-bold text-white mt-1 block">{metrics.totalAgencies}</span>
            <span className="text-[10px] text-purple-400/80">Guilds Registered</span>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/20">
            <span className="text-[10px] text-emerald-400 block uppercase font-medium">Active Agencies</span>
            <span className="text-xl font-bold text-emerald-300 mt-1 block">{metrics.activeAgencies}</span>
            <span className="text-[10px] text-emerald-400/80">Authorized</span>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-amber-500/20">
            <span className="text-[10px] text-amber-400 block uppercase font-medium">Pending Guilds</span>
            <span className="text-xl font-bold text-amber-300 mt-1 block">{metrics.pendingAgencies}</span>
            <span className="text-[10px] text-amber-400/80">Under Review</span>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-purple-500/20">
            <span className="text-[10px] text-purple-400 block uppercase font-medium">Total Sellers</span>
            <span className="text-xl font-bold text-white mt-1 block">{metrics.totalSellers}</span>
            <span className="text-[10px] text-purple-400/80">Resellers</span>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/20">
            <span className="text-[10px] text-emerald-400 block uppercase font-medium">Active Sellers</span>
            <span className="text-xl font-bold text-emerald-300 mt-1 block">{metrics.activeSellers}</span>
            <span className="text-[10px] text-emerald-400/80">Dispatched</span>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-amber-500/20">
            <span className="text-[10px] text-amber-400 block uppercase font-medium">Pending Payouts</span>
            <span className="text-xl font-bold text-amber-300 mt-1 block">
              {metrics.pendingPayoutRequests + metrics.underReviewPayoutRequests}
            </span>
            <span className="text-[10px] text-amber-400/80">Queue Depth</span>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-purple-500/20">
            <span className="text-[10px] text-purple-400 block uppercase font-medium">Completed</span>
            <span className="text-xl font-bold text-purple-300 mt-1 block">{metrics.completedPayouts}</span>
            <span className="text-[10px] text-purple-400/80">Settled Demo</span>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-pink-500/20">
            <span className="text-[10px] text-pink-400 block uppercase font-medium">Total Payouts</span>
            <span className="text-xl font-bold text-pink-300 mt-1 block">
              ${(metrics.totalDemoPayoutAmountUsd / 1000).toFixed(1)}k
            </span>
            <span className="text-[10px] text-pink-400/80">USD Simulated</span>
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Review Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions Panel */}
        <div className="p-5 rounded-2xl bg-[#180930]/90 border border-purple-500/20 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-400" />
            Quick Operational Actions
          </h3>

          <button
            onClick={() => onNavigateTab('agencies')}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-purple-950/40 hover:bg-purple-900/40 border border-purple-500/20 text-xs font-medium text-white transition cursor-pointer"
          >
            <span className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-pink-400" />
              Manage Agency Guilds ({metrics.totalAgencies})
            </span>
            <ChevronRight className="w-4 h-4 text-purple-400" />
          </button>

          <button
            onClick={() => onNavigateTab('sellers')}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-purple-950/40 hover:bg-purple-900/40 border border-purple-500/20 text-xs font-medium text-white transition cursor-pointer"
          >
            <span className="flex items-center gap-2.5">
              <Store className="w-4 h-4 text-pink-400" />
              Manage Coin Sellers ({metrics.totalSellers})
            </span>
            <ChevronRight className="w-4 h-4 text-purple-400" />
          </button>

          <button
            onClick={() => onNavigateTab('payout_requests')}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-purple-950/40 hover:bg-purple-900/40 border border-purple-500/20 text-xs font-medium text-white transition cursor-pointer"
          >
            <span className="flex items-center gap-2.5">
              <CreditCard className="w-4 h-4 text-amber-400" />
              Adjudicate Payout Requests ({metrics.totalPayoutRequests})
            </span>
            <ChevronRight className="w-4 h-4 text-purple-400" />
          </button>

          <button
            onClick={() => onNavigateTab('payout_history')}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-purple-950/40 hover:bg-purple-900/40 border border-purple-500/20 text-xs font-medium text-white transition cursor-pointer"
          >
            <span className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-purple-400" />
              Historical Payout Audit Log
            </span>
            <ChevronRight className="w-4 h-4 text-purple-400" />
          </button>

          <button
            onClick={() => onNavigateTab('financial_overview')}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-purple-950/40 hover:bg-purple-900/40 border border-purple-500/20 text-xs font-medium text-white transition cursor-pointer"
          >
            <span className="flex items-center gap-2.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Financial Activity Summary
            </span>
            <ChevronRight className="w-4 h-4 text-purple-400" />
          </button>
        </div>

        {/* Recent Admin Review Activity Feed */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#180930]/90 border border-purple-500/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
              <Shield className="w-4 h-4 text-pink-400" />
              Recent Admin Review Activity
            </h3>
            <button
              onClick={() => onNavigateTab('review_history')}
              className="text-xs text-pink-400 hover:text-pink-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              View Full Timeline <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {activities.slice(0, 5).map((act) => (
              <div
                key={act.id}
                className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-purple-500/15"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-300">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{act.description}</p>
                    <p className="text-[11px] text-purple-300">
                      by <span className="text-pink-400">{act.adminName}</span> • Target: {act.relatedRecordId}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-purple-400 whitespace-nowrap ml-2">{act.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
