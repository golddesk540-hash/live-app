export type AgentEarningsTab = 'dashboard' | 'monthly' | 'commission' | 'host_activity';

export type DateFilterPeriod = 'today' | 'this_week' | 'this_month' | 'last_month' | 'custom';

export type EarningRecordStatus = 'Pending' | 'Processing' | 'Completed' | 'Cancelled';

export type EarningActivityCategory =
  | 'Host activity share'
  | 'Agency-related activity'
  | 'Monthly earning record'
  | 'Pending earning entry'
  | 'Completed earning entry';

export type TransactionSortMode =
  | 'date_desc'
  | 'date_asc'
  | 'amount_desc'
  | 'amount_asc';

export type ChartViewMode = 'daily' | 'weekly' | 'monthly' | 'comparison';

export type AgentEmptyKind =
  | 'no_earnings'
  | 'no_pending'
  | 'no_completed'
  | 'no_commission_history'
  | 'no_host_activity'
  | 'no_search_results';

export interface AgentProfileSummary {
  agentId: string;
  username: string;
  handle: string;
  avatarUrl: string;
  agencyName: string;
  unitLabel: string;
  demoCaption: string;
}

export interface AgentEarningSummaryMetrics {
  totalEarningsPts: number;
  thisMonthPts: number;
  lastMonthPts: number;
  pendingEarningsPts: number;
  completedEarningsPts: number;
}

export interface AgentEarningRecord {
  id: string;
  title: string;
  category: EarningActivityCategory;
  hostId: string;
  hostName: string;
  hostHandle: string;
  hostAvatarUrl: string;
  referenceCode: string;
  dateIso: string;
  dateLabel: string;
  sampleAmountPts: number;
  status: EarningRecordStatus;
  summaryNote: string;
}

export interface CommissionHistoryRecord {
  commissionId: string;
  linkedEarningId: string;
  hostId: string;
  hostName: string;
  hostHandle: string;
  hostAvatarUrl: string;
  activityDateIso: string;
  activityDateLabel: string;
  sampleCommissionPts: number;
  status: EarningRecordStatus;
  activityTitle: string;
  note: string;
}

export interface HostActivityEarningItem {
  recordId: string;
  hostId: string;
  username: string;
  handle: string;
  avatarUrl: string;
  verified: boolean;
  activitySummary: string;
  relatedEarningTitle: string;
  activityDateIso: string;
  activityDateLabel: string;
  sampleAmountPts: number;
  status: EarningRecordStatus;
}

export interface AgentChartPoint {
  label: string;
  completedPts: number;
  pendingPts: number;
}

export interface EarningDetailPayload {
  recordId: string;
  category: string;
  relatedHostOrActivity: string;
  hostHandle?: string;
  hostAvatarUrl?: string;
  hostId?: string;
  dateLabel: string;
  referenceCode: string;
  sampleAmountPts: number;
  status: EarningRecordStatus;
  additionalInfo: string;
}
