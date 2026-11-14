export type DateRangeOption = 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'custom';

export type DashboardViewTab =
  | 'overview'
  | 'growth'
  | 'economy'
  | 'analytics_hub'
  | 'activity'
  | 'quick_nav';

export type ModuleCategoryKey =
  | 'all'
  | 'users'
  | 'hosts'
  | 'live'
  | 'reports'
  | 'safety'
  | 'economy'
  | 'agencies'
  | 'sellers'
  | 'payouts'
  | 'news'
  | 'push';

export type DashboardEmptyKind =
  | 'no_user_analytics'
  | 'no_host_analytics'
  | 'no_live_sessions'
  | 'no_reports'
  | 'no_safety_cases'
  | 'no_economy_activity'
  | 'no_agencies'
  | 'no_sellers'
  | 'no_payout_requests'
  | 'no_content_records'
  | 'no_news_articles'
  | 'no_notification_campaigns'
  | 'no_platform_activity'
  | 'no_search_results';

export interface ExecutiveMetrics {
  // Hero 4 metrics matching 10_09_dashboard.png
  totalUsers: number; // 1,245,320
  activeHosts: number; // 8,420
  liveSessions: number; // 56,320
  totalCoins: number; // 98,540,000

  // Secondary metrics
  activeUsers: number; // 842,100
  newRegistrations: number; // 14,250
  suspendedUsers: number; // 1,420
  totalHosts: number; // 28,450
  pendingHosts: number; // 380
  currentLiveViewers: number; // 256,480
  peakViewersToday: number; // 384,120
  pendingReports: number; // 32
  totalReports: number; // 56
  openSafetyCases: number; // 14
  highPrioritySafety: number; // 4
  coinPurchaseVolume: number; // 24,150,000
  giftTransferVolume: number; // 18,920,000
  activeAgencies: number; // 24
  activeSellers: number; // 38
  pendingPayouts: number; // 22
  pendingPayoutAmount: number; // 48,250
  totalContentItems: number; // 68
  publishedNews: number; // 14
  activeLanguages: number; // 7
  totalSupportedLanguages: number; // 8
  translationPercentage: number; // 92
  totalPushCampaigns: number; // 16
  scheduledPushCampaigns: number; // 4
  totalPushReach: number; // 1,400,000
}

export interface ChartDataPoint {
  label: string; // e.g. Mon, Tue, Jan, etc.
  value: number; // primary bar or line value
  secondaryValue?: number; // e.g. compare with previous period
  formattedValue?: string; // e.g. "1.24M", "8.4k"
  tooltipNote?: string;
}

export interface PlatformActivityRecord {
  id: string; // e.g. ACT-10901
  title: string;
  module:
    | 'Users'
    | 'Hosts'
    | 'Live'
    | 'Reports'
    | 'Safety'
    | 'Economy'
    | 'Agencies'
    | 'Sellers'
    | 'Payouts'
    | 'News'
    | 'Push';
  timestamp: string;
  description: string;
  relatedRecordId: string;
  severity: 'info' | 'success' | 'warning' | 'alert';
}

export interface AdminActionAuditRecord {
  id: string; // e.g. AUD-901
  adminName: string;
  adminRole:
    | 'Super Admin'
    | 'Admin'
    | 'Moderator'
    | 'Support Agent'
    | 'Finance Manager'
    | 'Content Manager';
  actionType: string;
  module: string;
  timestamp: string;
  description: string;
  targetId: string;
}

export interface QuickNavModuleItem {
  id: string;
  moduleCode: string; // e.g. "10.1", "10.2", ...
  title: string;
  description: string;
  iconName: string;
  targetSection: string;
  badge?: string;
  badgeColor?: string;
  statsSummary: string;
}

export interface CustomDateRange {
  startDate: string;
  endDate: string;
}
