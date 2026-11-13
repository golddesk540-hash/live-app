export type AgencyStatus = 'Active' | 'Pending' | 'Inactive' | 'Suspended';
export type SellerStatus = 'Active' | 'Pending' | 'Inactive' | 'Suspended';
export type SellerType = 'Official Merchant' | 'Certified Vendor' | 'Peer Reseller';
export type PayoutStatus = 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Completed';
export type PayoutAccountType = 'Agency' | 'Coin Seller' | 'Host';

export type AgencySellerPayoutTab =
  | 'dashboard'
  | 'agencies'
  | 'sellers'
  | 'payout_dashboard'
  | 'payout_requests'
  | 'payout_history'
  | 'financial_overview'
  | 'review_history';

export type AgencySellerPayoutEmptyKind =
  | 'no_agencies'
  | 'no_sellers'
  | 'no_payout_requests'
  | 'no_pending_payouts'
  | 'no_approved_payouts'
  | 'no_completed_payouts'
  | 'no_rejected_payouts'
  | 'no_financial_activity'
  | 'no_search_results';

export interface AgencyHostSummary {
  hostId: string;
  name: string;
  username: string;
  avatar: string;
  liveStatus: 'online' | 'offline';
  joinedAt: string;
  monthlyPoints: number;
  commissionRate: number;
}

export interface AgencyHistoryEvent {
  id: string;
  date: string;
  title: string;
  actor: string;
  description: string;
}

export interface AgencyRecord {
  id: string; // e.g. AG1001
  name: string;
  logo: string;
  logoPreset?: string;
  description: string;
  owner: string;
  ownerUsername: string;
  ownerAvatar: string;
  ownerEmail: string;
  ownerPhone: string;
  country: string;
  totalHosts: number;
  activeHosts: number;
  pendingHosts: number;
  registeredAt: string;
  status: AgencyStatus;
  commissionRate: number; // percentage, e.g. 15%
  monthlyVolumePoints: number;
  activityOverview: string;
  reviewNotes: string;
  hosts: AgencyHostSummary[];
  history: AgencyHistoryEvent[];
}

export interface SellerOrderSample {
  orderId: string;
  coinQuantity: number;
  demoAmountUsd: number;
  status: 'Completed' | 'Pending' | 'Processing';
  buyerName: string;
  date: string;
}

export interface SellerRecord {
  id: string; // e.g. SL2001
  name: string;
  username: string;
  avatar: string;
  sellerType: SellerType;
  status: SellerStatus;
  registeredAt: string;
  totalCoinsSold: number;
  totalDemoSalesAmountUsd: number;
  totalDemoSalesAmountPkr: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  rating: number;
  region: string;
  contactEmail: string;
  contactPhone: string;
  reviewNotes: string;
  activityHistory: Array<{
    id: string;
    date: string;
    title: string;
    description: string;
  }>;
  relatedPayoutIds: string[];
  recentOrders: SellerOrderSample[];
}

export interface PayoutTimelineItem {
  id: string;
  date: string;
  title: string;
  actor: string;
  note?: string;
}

export interface PayoutRecord {
  id: string; // e.g. PYS-8421
  accountId: string; // e.g. AG1001 or SL2001
  accountName: string;
  accountType: PayoutAccountType;
  accountAvatar?: string;
  requestedDemoAmountUsd: number;
  requestedDemoAmountPkr: number;
  requestDate: string;
  lastUpdated: string;
  paymentMethodPlaceholder: string; // e.g. Bank Transfer (Meezan), JazzCash, USDT (TRC20)
  maskedAccountIdentifier: string; // e.g. "IBAN: PK64MEZN00************1234"
  accountHolderName: string;
  status: PayoutStatus;
  reviewNotes: string;
  reviewedBy?: string;
  reviewedAt?: string;
  timeline: PayoutTimelineItem[];
}

export interface AdminReviewActivityItem {
  id: string;
  adminName: string;
  activityType:
    | 'Agency Status Update'
    | 'Agency Profile Reviewed'
    | 'Seller Status Update'
    | 'Seller Profile Reviewed'
    | 'Payout Request Opened'
    | 'Payout Marked Under Review'
    | 'Payout Approved'
    | 'Payout Rejected'
    | 'Payout Completed';
  relatedRecordId: string;
  timestamp: string;
  description: string;
}

export interface AgencySellerPayoutMetrics {
  totalAgencies: number;
  activeAgencies: number;
  pendingAgencies: number;
  suspendedAgencies: number;
  totalSellers: number;
  activeSellers: number;
  pendingSellers: number;
  totalPayoutRequests: number;
  pendingPayoutRequests: number;
  underReviewPayoutRequests: number;
  approvedPayoutRequests: number;
  rejectedPayoutRequests: number;
  completedPayouts: number;
  totalDemoPayoutAmountUsd: number;
  totalDemoPayoutAmountPkr: number;
  agencyPayoutAmountUsd: number;
  sellerPayoutAmountUsd: number;
  pendingPayoutAmountUsd: number;
  approvedPayoutAmountUsd: number;
  completedPayoutAmountUsd: number;
}

export interface MonthlyPayoutChartPoint {
  month: string;
  agencyPayouts: number;
  sellerPayouts: number;
  totalPayouts: number;
}
