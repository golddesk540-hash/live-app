'use client';

import React, { useState, useMemo } from 'react';
import {
  Building2,
  Store,
  CreditCard,
  LayoutDashboard,
  Clock,
  TrendingUp,
  Shield,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import {
  AgencyRecord,
  SellerRecord,
  PayoutRecord,
  AdminReviewActivityItem,
  AgencySellerPayoutTab,
  AgencyStatus,
  SellerStatus,
  PayoutStatus,
} from './agencySellerPayoutTypes';
import {
  INITIAL_AGENCIES,
  INITIAL_SELLERS,
  INITIAL_PAYOUT_REQUESTS,
  INITIAL_ADMIN_REVIEW_ACTIVITIES,
  computeAgencySellerPayoutMetrics,
} from './mockAgencySellerPayoutData';
import { AgencySellerPayoutDashboardView } from './AgencySellerPayoutDashboardView';
import { AgencyManagementView } from './AgencyManagementView';
import { SellerManagementView } from './SellerManagementView';
import { PayoutDashboardView } from './PayoutDashboardView';
import { PayoutRequestsView } from './PayoutRequestsView';
import { PayoutHistoryView } from './PayoutHistoryView';
import { FinancialActivityOverviewView } from './FinancialActivityOverviewView';
import { AdminReviewHistoryView } from './AdminReviewHistoryView';
import { AgencyDetailsModal } from './AgencyDetailsModal';
import { AgencyStatusModal } from './AgencyStatusModal';
import { SellerDetailsModal } from './SellerDetailsModal';
import { SellerStatusModal } from './SellerStatusModal';
import { PayoutDetailsModal } from './PayoutDetailsModal';
import { PayoutReviewModal } from './PayoutReviewModal';

interface AgencySellerPayoutAdminModuleProps {
  onLogAdminActivity?: (actionTitle: string, details: string, category?: any) => void;
}

export const AgencySellerPayoutAdminModule: React.FC<AgencySellerPayoutAdminModuleProps> = ({
  onLogAdminActivity,
}) => {
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<AgencySellerPayoutTab>('dashboard');

  // Master local state
  const [agencies, setAgencies] = useState<AgencyRecord[]>(INITIAL_AGENCIES);
  const [sellers, setSellers] = useState<SellerRecord[]>(INITIAL_SELLERS);
  const [payouts, setPayouts] = useState<PayoutRecord[]>(INITIAL_PAYOUT_REQUESTS);
  const [activities, setActivities] = useState<AdminReviewActivityItem[]>(INITIAL_ADMIN_REVIEW_ACTIVITIES);

  // Modals state
  const [selectedAgencyForDetails, setSelectedAgencyForDetails] = useState<AgencyRecord | null>(null);
  const [selectedAgencyForStatus, setSelectedAgencyForStatus] = useState<AgencyRecord | null>(null);

  const [selectedSellerForDetails, setSelectedSellerForDetails] = useState<SellerRecord | null>(null);
  const [selectedSellerForStatus, setSelectedSellerForStatus] = useState<SellerRecord | null>(null);

  const [selectedPayoutForDetails, setSelectedPayoutForDetails] = useState<PayoutRecord | null>(null);
  const [selectedPayoutForReview, setSelectedPayoutForReview] = useState<PayoutRecord | null>(null);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const triggerToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Recomputed dynamic metrics
  const metrics = useMemo(() => {
    return computeAgencySellerPayoutMetrics(agencies, sellers, payouts);
  }, [agencies, sellers, payouts]);

  // Agency Status Handler
  const handleSaveAgencyStatus = (agencyId: string, newStatus: AgencyStatus, notes: string) => {
    setAgencies((prev) =>
      prev.map((a) => {
        if (a.id === agencyId) {
          return {
            ...a,
            status: newStatus,
            reviewNotes: notes,
            activeHosts: newStatus === 'Active' ? a.activeHosts : 0,
          };
        }
        return a;
      })
    );

    const agency = agencies.find((a) => a.id === agencyId);
    const agencyName = agency ? agency.name : agencyId;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newActivity: AdminReviewActivityItem = {
      id: `REV-${Date.now().toString().slice(-4)}`,
      adminName: 'Admin_Sarah',
      activityType: 'Agency Status Update',
      relatedRecordId: agencyId,
      timestamp: now,
      description: `Updated status for ${agencyName} to ${newStatus}. Note: ${notes || 'Status adjusted in admin panel'}`,
    };

    setActivities((prev) => [newActivity, ...prev]);
    triggerToast(`Agency ${agencyName} updated to ${newStatus}`);

    if (onLogAdminActivity) {
      onLogAdminActivity('Agency Status Changed', `Agency ${agencyId} updated to ${newStatus}`);
    }
  };

  // Seller Status Handler
  const handleSaveSellerStatus = (sellerId: string, newStatus: SellerStatus, notes: string) => {
    setSellers((prev) =>
      prev.map((s) => {
        if (s.id === sellerId) {
          return {
            ...s,
            status: newStatus,
            reviewNotes: notes,
          };
        }
        return s;
      })
    );

    const seller = sellers.find((s) => s.id === sellerId);
    const sellerName = seller ? seller.username : sellerId;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newActivity: AdminReviewActivityItem = {
      id: `REV-${Date.now().toString().slice(-4)}`,
      adminName: 'Admin_Sarah',
      activityType: 'Seller Status Update',
      relatedRecordId: sellerId,
      timestamp: now,
      description: `Updated status for merchant @${sellerName} to ${newStatus}. Note: ${notes || 'Status adjusted in admin panel'}`,
    };

    setActivities((prev) => [newActivity, ...prev]);
    triggerToast(`Seller @${sellerName} updated to ${newStatus}`);

    if (onLogAdminActivity) {
      onLogAdminActivity('Seller Status Changed', `Seller ${sellerId} updated to ${newStatus}`);
    }
  };

  // Payout Review Handler
  const handleSavePayoutReview = (payoutId: string, newStatus: PayoutStatus, notes: string) => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    setPayouts((prev) =>
      prev.map((p) => {
        if (p.id === payoutId) {
          const newTimelineItem = {
            id: `TL-${Date.now()}`,
            date: now,
            title: `Status Changed to ${newStatus}`,
            actor: 'Admin_Sarah',
            note: notes,
          };
          return {
            ...p,
            status: newStatus,
            reviewNotes: notes,
            reviewedBy: 'Admin_Sarah',
            reviewedAt: now,
            lastUpdated: now,
            timeline: [newTimelineItem, ...p.timeline],
          };
        }
        return p;
      })
    );

    const targetPayout = payouts.find((p) => p.id === payoutId);
    const newActivity: AdminReviewActivityItem = {
      id: `REV-${Date.now().toString().slice(-4)}`,
      adminName: 'Admin_Sarah',
      activityType:
        newStatus === 'Approved'
          ? 'Payout Approved'
          : newStatus === 'Rejected'
          ? 'Payout Rejected'
          : newStatus === 'Completed'
          ? 'Payout Completed'
          : 'Payout Marked Under Review',
      relatedRecordId: payoutId,
      timestamp: now,
      description: `Marked payout #${payoutId} (${targetPayout?.accountName}) as ${newStatus}`,
    };

    setActivities((prev) => [newActivity, ...prev]);
    triggerToast(`Payout #${payoutId} marked as ${newStatus}`);

    if (onLogAdminActivity) {
      onLogAdminActivity('Payout Adjudicated', `Payout #${payoutId} status set to ${newStatus}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-[#240d42] border border-pink-500/50 rounded-2xl shadow-2xl shadow-pink-950/50 text-white text-xs font-semibold animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 text-purple-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Visual Filter Pills matching image 10_07 (Agency | Coin Seller | Payouts) */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-black/40 border border-purple-500/25 rounded-2xl backdrop-blur-md">
        <button
          data-testid="agency-seller-payout-tab-dashboard"
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/25'
              : 'text-purple-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button
          data-testid="agency-seller-payout-tab-agencies"
          onClick={() => setActiveTab('agencies')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'agencies'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/25'
              : 'text-purple-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Agency</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-900/60 text-pink-300">
            {metrics.totalAgencies}
          </span>
        </button>

        <button
          data-testid="agency-seller-payout-tab-sellers"
          onClick={() => setActiveTab('sellers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'sellers'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/25'
              : 'text-purple-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Coin Seller</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-900/60 text-pink-300">
            {metrics.totalSellers}
          </span>
        </button>

        <button
          data-testid="agency-seller-payout-tab-payouts"
          onClick={() => setActiveTab('payout_requests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'payout_requests' || activeTab === 'payout_dashboard'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/25'
              : 'text-purple-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payouts</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-bold">
            {metrics.pendingPayoutRequests + metrics.underReviewPayoutRequests}
          </span>
        </button>

        <div className="h-5 w-px bg-purple-500/20 mx-1 hidden sm:block" />

        <button
          data-testid="agency-seller-payout-tab-history"
          onClick={() => setActiveTab('payout_history')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
            activeTab === 'payout_history'
              ? 'bg-purple-600/30 text-white border border-purple-500/40'
              : 'text-purple-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-purple-400" />
          <span>Payout History</span>
        </button>

        <button
          data-testid="agency-seller-payout-tab-financial-overview"
          onClick={() => setActiveTab('financial_overview')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
            activeTab === 'financial_overview'
              ? 'bg-purple-600/30 text-white border border-purple-500/40'
              : 'text-purple-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span>Financials</span>
        </button>

        <button
          data-testid="agency-seller-payout-tab-review-history"
          onClick={() => setActiveTab('review_history')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
            activeTab === 'review_history'
              ? 'bg-purple-600/30 text-white border border-purple-500/40'
              : 'text-purple-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-pink-400" />
          <span>Audit Trail</span>
        </button>
      </div>

      {/* Main Tab Render */}
      {activeTab === 'dashboard' && (
        <AgencySellerPayoutDashboardView
          agencies={agencies}
          sellers={sellers}
          payouts={payouts}
          activities={activities}
          metrics={metrics}
          onNavigateTab={setActiveTab}
          onOpenAgencyDetails={(a) => setSelectedAgencyForDetails(a)}
          onOpenSellerDetails={(s) => setSelectedSellerForDetails(s)}
          onOpenPayoutDetails={(p) => setSelectedPayoutForDetails(p)}
        />
      )}

      {activeTab === 'agencies' && (
        <AgencyManagementView
          agencies={agencies}
          onOpenAgencyDetails={(a) => setSelectedAgencyForDetails(a)}
          onOpenAgencyStatusModal={(a) => setSelectedAgencyForStatus(a)}
        />
      )}

      {activeTab === 'sellers' && (
        <SellerManagementView
          sellers={sellers}
          onOpenSellerDetails={(s) => setSelectedSellerForDetails(s)}
          onOpenSellerStatusModal={(s) => setSelectedSellerForStatus(s)}
        />
      )}

      {activeTab === 'payout_dashboard' && (
        <PayoutDashboardView
          payouts={payouts}
          metrics={metrics}
          onNavigateTab={setActiveTab}
          onOpenPayoutDetails={(p) => setSelectedPayoutForDetails(p)}
          onOpenReviewModal={(p) => setSelectedPayoutForReview(p)}
        />
      )}

      {activeTab === 'payout_requests' && (
        <PayoutRequestsView
          payouts={payouts}
          onOpenPayoutDetails={(p) => setSelectedPayoutForDetails(p)}
          onOpenReviewModal={(p) => setSelectedPayoutForReview(p)}
        />
      )}

      {activeTab === 'payout_history' && (
        <PayoutHistoryView
          payouts={payouts}
          onOpenPayoutDetails={(p) => setSelectedPayoutForDetails(p)}
        />
      )}

      {activeTab === 'financial_overview' && (
        <FinancialActivityOverviewView
          metrics={metrics}
          recentPayouts={payouts}
          onOpenPayoutDetails={(p) => setSelectedPayoutForDetails(p)}
        />
      )}

      {activeTab === 'review_history' && (
        <AdminReviewHistoryView activities={activities} />
      )}

      {/* Modals */}
      {selectedAgencyForDetails && (
        <AgencyDetailsModal
          agency={selectedAgencyForDetails}
          isOpen={true}
          onClose={() => setSelectedAgencyForDetails(null)}
          onEditStatus={(a) => {
            setSelectedAgencyForDetails(null);
            setSelectedAgencyForStatus(a);
          }}
        />
      )}

      {selectedAgencyForStatus && (
        <AgencyStatusModal
          agency={selectedAgencyForStatus}
          isOpen={true}
          onClose={() => setSelectedAgencyForStatus(null)}
          onSaveStatus={handleSaveAgencyStatus}
        />
      )}

      {selectedSellerForDetails && (
        <SellerDetailsModal
          seller={selectedSellerForDetails}
          isOpen={true}
          onClose={() => setSelectedSellerForDetails(null)}
          onEditStatus={(s) => {
            setSelectedSellerForDetails(null);
            setSelectedSellerForStatus(s);
          }}
          onViewPayout={(payoutId) => {
            const p = payouts.find((item) => item.id === payoutId);
            if (p) {
              setSelectedSellerForDetails(null);
              setSelectedPayoutForDetails(p);
            }
          }}
        />
      )}

      {selectedSellerForStatus && (
        <SellerStatusModal
          seller={selectedSellerForStatus}
          isOpen={true}
          onClose={() => setSelectedSellerForStatus(null)}
          onSaveStatus={handleSaveSellerStatus}
        />
      )}

      {selectedPayoutForDetails && (
        <PayoutDetailsModal
          payout={selectedPayoutForDetails}
          isOpen={true}
          onClose={() => setSelectedPayoutForDetails(null)}
          onOpenReview={(p) => {
            setSelectedPayoutForDetails(null);
            setSelectedPayoutForReview(p);
          }}
        />
      )}

      {selectedPayoutForReview && (
        <PayoutReviewModal
          payout={selectedPayoutForReview}
          isOpen={true}
          onClose={() => setSelectedPayoutForReview(null)}
          onSaveReview={handleSavePayoutReview}
        />
      )}
    </div>
  );
};
