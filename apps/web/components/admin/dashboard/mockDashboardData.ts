import {
  ExecutiveMetrics,
  ChartDataPoint,
  PlatformActivityRecord,
  AdminActionAuditRecord,
  QuickNavModuleItem,
  DateRangeOption,
} from './dashboardTypes';

// Primary baseline metrics matching 10_09_dashboard.png exactly
export const BASELINE_EXECUTIVE_METRICS: ExecutiveMetrics = {
  totalUsers: 1245320,
  activeHosts: 8420,
  liveSessions: 56320,
  totalCoins: 98540000,

  activeUsers: 842100,
  newRegistrations: 14250,
  suspendedUsers: 1420,
  totalHosts: 28450,
  pendingHosts: 380,
  currentLiveViewers: 256480,
  peakViewersToday: 384120,
  pendingReports: 32,
  totalReports: 56,
  openSafetyCases: 14,
  highPrioritySafety: 4,
  coinPurchaseVolume: 24150000,
  giftTransferVolume: 18920000,
  activeAgencies: 24,
  activeSellers: 38,
  pendingPayouts: 22,
  pendingPayoutAmount: 48250,
  totalContentItems: 68,
  publishedNews: 14,
  activeLanguages: 7,
  totalSupportedLanguages: 8,
  translationPercentage: 92,
  totalPushCampaigns: 16,
  scheduledPushCampaigns: 4,
  totalPushReach: 1400000,
};

// Dynamically scale metrics based on selected date range
export function getMetricsForDateRange(
  range: DateRangeOption,
  customDays?: number
): ExecutiveMetrics {
  const base = { ...BASELINE_EXECUTIVE_METRICS };
  switch (range) {
    case 'today':
      return {
        ...base,
        newRegistrations: 14250,
        liveSessions: 1264,
        coinPurchaseVolume: 3240000,
        giftTransferVolume: 2810000,
        pendingReports: 32,
        pendingPayouts: 22,
      };
    case 'yesterday':
      return {
        ...base,
        newRegistrations: 12890,
        liveSessions: 1198,
        coinPurchaseVolume: 2980000,
        giftTransferVolume: 2640000,
        pendingReports: 28,
        pendingPayouts: 19,
      };
    case '7d':
      return {
        ...base,
        newRegistrations: 94800,
        liveSessions: 8940,
        coinPurchaseVolume: 24150000,
        giftTransferVolume: 18920000,
      };
    case '30d':
      return {
        ...base,
        newRegistrations: 384200,
        liveSessions: 38240,
        coinPurchaseVolume: 98540000,
        giftTransferVolume: 74210000,
      };
    case '90d':
      return {
        ...base,
        newRegistrations: 1120000,
        liveSessions: 112400,
        coinPurchaseVolume: 284000000,
        giftTransferVolume: 218000000,
      };
    case 'custom':
      const days = customDays || 14;
      return {
        ...base,
        newRegistrations: Math.round(13500 * days),
        liveSessions: Math.round(1220 * days),
        coinPurchaseVolume: Math.round(3100000 * days),
        giftTransferVolume: Math.round(2700000 * days),
      };
    default:
      return base;
  }
}

// 1. User Growth Chart — Mon to Sun matching 10_09_dashboard.png visual reference
export const USER_GROWTH_7D: ChartDataPoint[] = [
  { label: 'Mon', value: 45, formattedValue: '1.18M', tooltipNote: 'Monday Active Trajectory' },
  { label: 'Tue', value: 68, formattedValue: '1.19M', tooltipNote: 'Tuesday Peak Registration' },
  { label: 'Wed', value: 92, formattedValue: '1.21M', tooltipNote: 'Mid-week Event Boost' },
  { label: 'Thu', value: 118, formattedValue: '1.22M', tooltipNote: 'Thursday Regional Push' },
  { label: 'Fri', value: 142, formattedValue: '1.23M', tooltipNote: 'Weekend Warmup' },
  { label: 'Sat', value: 175, formattedValue: '1.24M', tooltipNote: 'Saturday Live Galas' },
  { label: 'Sun', value: 210, formattedValue: '1.245M', tooltipNote: 'Peak Weekend Peak' },
];

export const USER_GROWTH_30D: ChartDataPoint[] = [
  { label: 'Week 1', value: 112, formattedValue: '1.12M' },
  { label: 'Week 2', value: 148, formattedValue: '1.16M' },
  { label: 'Week 3', value: 184, formattedValue: '1.21M' },
  { label: 'Week 4', value: 220, formattedValue: '1.245M' },
];

export const USER_GROWTH_90D: ChartDataPoint[] = [
  { label: 'Month 1', value: 95, formattedValue: '980k' },
  { label: 'Month 2', value: 160, formattedValue: '1.12M' },
  { label: 'Month 3', value: 230, formattedValue: '1.245M' },
];

// 2. Host Growth Chart
export const HOST_GROWTH_CHART: ChartDataPoint[] = [
  { label: 'Mon', value: 7420, formattedValue: '7,420' },
  { label: 'Tue', value: 7650, formattedValue: '7,650' },
  { label: 'Wed', value: 7890, formattedValue: '7,890' },
  { label: 'Thu', value: 8050, formattedValue: '8,050' },
  { label: 'Fri', value: 8210, formattedValue: '8,210' },
  { label: 'Sat', value: 8350, formattedValue: '8,350' },
  { label: 'Sun', value: 8420, formattedValue: '8,420' },
];

// 3. Live Streaming Activity Chart (Concurrent Active Streams)
export const LIVE_ACTIVITY_CHART: ChartDataPoint[] = [
  { label: '00:00', value: 410, formattedValue: '410 live' },
  { label: '04:00', value: 280, formattedValue: '280 live' },
  { label: '08:00', value: 540, formattedValue: '540 live' },
  { label: '12:00', value: 890, formattedValue: '890 live' },
  { label: '16:00', value: 1120, formattedValue: '1,120 live' },
  { label: '20:00', value: 1264, formattedValue: '1,264 live' },
  { label: '23:00', value: 980, formattedValue: '980 live' },
];

// 4. Viewer Activity Chart (Live Viewers)
export const VIEWER_ACTIVITY_CHART: ChartDataPoint[] = [
  { label: '00:00', value: 84000, formattedValue: '84k viewers' },
  { label: '04:00', value: 52000, formattedValue: '52k viewers' },
  { label: '08:00', value: 110000, formattedValue: '110k viewers' },
  { label: '12:00', value: 185000, formattedValue: '185k viewers' },
  { label: '16:00', value: 224000, formattedValue: '224k viewers' },
  { label: '20:00', value: 256480, formattedValue: '256k viewers' },
  { label: '23:00', value: 198000, formattedValue: '198k viewers' },
];

// 5. Report Status Distribution Chart
export const REPORT_STATUS_CHART: ChartDataPoint[] = [
  { label: 'Pending', value: 32, formattedValue: '32 cases' },
  { label: 'Under Review', value: 14, formattedValue: '14 cases' },
  { label: 'Resolved', value: 8, formattedValue: '8 cases' },
  { label: 'Rejected', value: 2, formattedValue: '2 cases' },
];

// 6. Child Safety Case Status Chart
export const SAFETY_STATUS_CHART: ChartDataPoint[] = [
  { label: 'Escalated Critical', value: 4, formattedValue: '4 critical' },
  { label: 'Pending Review', value: 10, formattedValue: '10 pending' },
  { label: 'Age Guard Flagged', value: 6, formattedValue: '6 flags' },
  { label: 'Resolved Closed', value: 24, formattedValue: '24 closed' },
];

// 7. Economy Activity Chart (Coin purchases vs Gift expenditure)
export const ECONOMY_ACTIVITY_CHART: ChartDataPoint[] = [
  { label: 'Mon', value: 3200, secondaryValue: 2400, formattedValue: '3.2M / 2.4M' },
  { label: 'Tue', value: 3450, secondaryValue: 2750, formattedValue: '3.4M / 2.7M' },
  { label: 'Wed', value: 3900, secondaryValue: 3100, formattedValue: '3.9M / 3.1M' },
  { label: 'Thu', value: 4200, secondaryValue: 3400, formattedValue: '4.2M / 3.4M' },
  { label: 'Fri', value: 4800, secondaryValue: 3850, formattedValue: '4.8M / 3.8M' },
  { label: 'Sat', value: 5400, secondaryValue: 4200, formattedValue: '5.4M / 4.2M' },
  { label: 'Sun', value: 5800, secondaryValue: 4600, formattedValue: '5.8M / 4.6M' },
];

// 8. Agency Distribution Chart (Associated Hosts)
export const AGENCY_DISTRIBUTION_CHART: ChartDataPoint[] = [
  { label: 'Alpha Talent', value: 48, formattedValue: '48 hosts' },
  { label: 'Gulf Stars', value: 35, formattedValue: '35 hosts' },
  { label: 'Crown UK', value: 28, formattedValue: '28 hosts' },
  { label: 'Asia Guild', value: 24, formattedValue: '24 hosts' },
  { label: 'Bosphorus Media', value: 18, formattedValue: '18 hosts' },
  { label: 'Others (19)', value: 82, formattedValue: '82 hosts' },
];

// 9. Payout Status Chart
export const PAYOUT_STATUS_CHART: ChartDataPoint[] = [
  { label: 'Pending', value: 12, formattedValue: '12 requests ($26.4k)' },
  { label: 'Under Review', value: 10, formattedValue: '10 requests ($21.8k)' },
  { label: 'Approved', value: 18, formattedValue: '18 requests ($38.5k)' },
  { label: 'Completed Demo', value: 42, formattedValue: '42 requests ($89.2k)' },
  { label: 'Rejected', value: 3, formattedValue: '3 requests ($4.1k)' },
];

// 10. Content & Virtual Items Distribution Chart
export const CONTENT_DISTRIBUTION_CHART: ChartDataPoint[] = [
  { label: 'Gifts (Standard)', value: 32, formattedValue: '32 gifts' },
  { label: 'Gifts (Special FX)', value: 12, formattedValue: '12 gifts' },
  { label: 'Coin Packages', value: 8, formattedValue: '8 tiers' },
  { label: 'Avatar Frames', value: 10, formattedValue: '10 frames' },
  { label: 'Entrance Effects', value: 6, formattedValue: '6 rides' },
];

// 11. Global Language Localization Progress Chart
export const LANGUAGE_PROGRESS_CHART: ChartDataPoint[] = [
  { label: 'English (en)', value: 100, formattedValue: '100% (Default)' },
  { label: 'Urdu (ur)', value: 98, formattedValue: '98% (Active)' },
  { label: 'Arabic (ar)', value: 96, formattedValue: '96% (Active)' },
  { label: 'Hindi (hi)', value: 94, formattedValue: '94% (Active)' },
  { label: 'Turkish (tr)', value: 91, formattedValue: '91% (Active)' },
  { label: 'Indonesian (id)', value: 89, formattedValue: '89% (Active)' },
  { label: 'Spanish (es)', value: 86, formattedValue: '86% (Active)' },
  { label: 'Bengali (bn)', value: 78, formattedValue: '78% (Staging)' },
];

// 12. Notification Campaign Performance Chart
export const NOTIFICATION_CAMPAIGN_CHART: ChartDataPoint[] = [
  { label: 'Weekend Bonanza', value: 42, formattedValue: '42% open rate' },
  { label: 'Spring Festival', value: 38, formattedValue: '38% open rate' },
  { label: 'Star Battle PK', value: 35, formattedValue: '35% open rate' },
  { label: 'Host Matching', value: 31, formattedValue: '31% open rate' },
  { label: 'Version 4.2', value: 28, formattedValue: '28% open rate' },
];

// 15+ Central Platform Activity Records
export const INITIAL_PLATFORM_ACTIVITIES: PlatformActivityRecord[] = [
  {
    id: 'ACT-10901',
    title: 'New Host Verified & Approved',
    module: 'Hosts',
    timestamp: '2 mins ago',
    description: 'Host "Alia_Voice" (H3009112) approved with Tier A earning privileges.',
    relatedRecordId: 'H3009112',
    severity: 'success',
  },
  {
    id: 'ACT-10902',
    title: 'Child Safety Underage Alert Flagged',
    module: 'Safety',
    timestamp: '5 mins ago',
    description: 'Face verification mismatch in Room #880219. Stream paused pending manual review.',
    relatedRecordId: 'SAFE-104',
    severity: 'alert',
  },
  {
    id: 'ACT-10903',
    title: 'High-Value Payout Request Submitted',
    module: 'Payouts',
    timestamp: '12 mins ago',
    description: 'Seller_Rahul requested payout of $1,250 USD via Meezan Bank Transfer.',
    relatedRecordId: 'PYS-8421',
    severity: 'warning',
  },
  {
    id: 'ACT-10904',
    title: 'Live Battle Peak Concurrency Reached',
    module: 'Live',
    timestamp: '18 mins ago',
    description: 'Room #880101 crossed 28,450 concurrent viewers during PK Battle Season 4.',
    relatedRecordId: 'LIVE-701',
    severity: 'info',
  },
  {
    id: 'ACT-10905',
    title: 'New Agency Registered',
    module: 'Agencies',
    timestamp: '25 mins ago',
    description: 'Bosphorus Media Talent (AG-1005) registered with 18 onboarded talent hosts.',
    relatedRecordId: 'AG-1005',
    severity: 'success',
  },
  {
    id: 'ACT-10906',
    title: 'Push Campaign Scheduled',
    module: 'Push',
    timestamp: '34 mins ago',
    description: 'Scheduled "Weekend Top Up Bonanza" to 1.4M subscribers for 18:00 UTC.',
    relatedRecordId: 'CMP-701',
    severity: 'info',
  },
  {
    id: 'ACT-10907',
    title: 'Urgent User Report Submitted',
    module: 'Reports',
    timestamp: '42 mins ago',
    description: 'Harassment reported in live room chat against user U1008241.',
    relatedRecordId: 'REP-401',
    severity: 'warning',
  },
  {
    id: 'ACT-10908',
    title: 'News Article Published',
    module: 'News',
    timestamp: '1 hour ago',
    description: 'Published "New Event Launch 🎉" across 8 localized languages.',
    relatedRecordId: 'NEWS-101',
    severity: 'success',
  },
  {
    id: 'ACT-10909',
    title: 'Urdu Translation Dictionary Updated',
    module: 'News',
    timestamp: '1.5 hours ago',
    description: 'Admin localized 24 new UI string keys for the upcoming PK Battle feature.',
    relatedRecordId: 'LANG-UR',
    severity: 'info',
  },
  {
    id: 'ACT-10910',
    title: 'New Coin Package Configured',
    module: 'Economy',
    timestamp: '2 hours ago',
    description: 'Added "Festival Starlight Pack" (100,000 Coins + 10,000 Bonus) to active store.',
    relatedRecordId: 'PKG-701',
    severity: 'success',
  },
  {
    id: 'ACT-10911',
    title: 'Coin Seller Verification Badge Granted',
    module: 'Sellers',
    timestamp: '3 hours ago',
    description: 'Seller "CoinMaster_PK" achieved 500,000 demo transaction volume milestone.',
    relatedRecordId: 'SL-2002',
    severity: 'success',
  },
  {
    id: 'ACT-10912',
    title: 'New User Registration Wave',
    module: 'Users',
    timestamp: '4 hours ago',
    description: 'Over 2,400 organic signups recorded from the GCC and South Asia regions.',
    relatedRecordId: 'USR-BATCH-4',
    severity: 'info',
  },
  {
    id: 'ACT-10913',
    title: 'Live Monitor Audio Booth Muted',
    module: 'Live',
    timestamp: '5 hours ago',
    description: 'Mic 3 in Party Room #880312 muted by automated policy guard for background noise.',
    relatedRecordId: 'LIVE-ROOM-312',
    severity: 'info',
  },
  {
    id: 'ACT-10914',
    title: 'Payout Request Completed in Demo Mode',
    module: 'Payouts',
    timestamp: '6 hours ago',
    description: 'Payout #PYS-8418 ($850 USD) approved and verified in demo ledger.',
    relatedRecordId: 'PYS-8418',
    severity: 'success',
  },
  {
    id: 'ACT-10915',
    title: 'Child Safety Age Gate Policy Verified',
    module: 'Safety',
    timestamp: '8 hours ago',
    description: 'Quarterly compliance check completed. 100% of hosts verified above age 18.',
    relatedRecordId: 'AUD-SAFE-01',
    severity: 'success',
  },
];

// 18+ Recent Admin Actions Audit Log matching Module 10.1 Roles
export const INITIAL_ADMIN_ACTIONS: AdminActionAuditRecord[] = [
  {
    id: 'AUD-901',
    adminName: 'Ayesha Noor',
    adminRole: 'Super Admin',
    actionType: 'Approved Host Identity',
    module: 'User & Host Admin',
    timestamp: '4 mins ago',
    description: 'Verified face biometrics and national ID for host Alia_Voice (H3009112).',
    targetId: 'H3009112',
  },
  {
    id: 'AUD-902',
    adminName: 'Bilal Khan',
    adminRole: 'Moderator',
    actionType: 'Escalated Safety Case',
    module: 'Child Safety Operations',
    timestamp: '8 mins ago',
    description: 'Escalated case #SAFE-104 to Senior Safety Council for age verification re-check.',
    targetId: 'SAFE-104',
  },
  {
    id: 'AUD-903',
    adminName: 'Tariq Mehmood',
    adminRole: 'Finance Manager',
    actionType: 'Reviewed Payout Request',
    module: 'Agency & Payout Admin',
    timestamp: '15 mins ago',
    description: 'Reviewed bank details and verified tax forms for Seller_Rahul #PYS-8421.',
    targetId: 'PYS-8421',
  },
  {
    id: 'AUD-904',
    adminName: 'Sarah Jenkins',
    adminRole: 'Content Manager',
    actionType: 'Published News Article',
    module: 'News, Languages & Push',
    timestamp: '22 mins ago',
    description: 'Published global article "New Event Launch 🎉" across 8 app languages.',
    targetId: 'NEWS-101',
  },
  {
    id: 'AUD-905',
    adminName: 'Farhan Ali',
    adminRole: 'Support Agent',
    actionType: 'Resolved User Ticket',
    module: 'Report Queue',
    timestamp: '35 mins ago',
    description: 'Handled coin discrepancy complaint and verified wallet balance history.',
    targetId: 'REP-408',
  },
  {
    id: 'AUD-906',
    adminName: 'Ayesha Noor',
    adminRole: 'Super Admin',
    actionType: 'Updated Role Permissions',
    module: 'Admin Home & Roles',
    timestamp: '52 mins ago',
    description: 'Granted push notification scheduling privileges to Content Managers group.',
    targetId: 'ROLE-CONT',
  },
  {
    id: 'AUD-907',
    adminName: 'Zainab Qureshi',
    adminRole: 'Moderator',
    actionType: 'Warned Live Room Host',
    module: 'Live Monitor',
    timestamp: '1 hour ago',
    description: 'Issued audio warning to Room #880402 for low lighting compliance.',
    targetId: 'ROOM-880402',
  },
  {
    id: 'AUD-908',
    adminName: 'Tariq Mehmood',
    adminRole: 'Finance Manager',
    actionType: 'Configured Coin Package',
    module: 'Content & Economy Admin',
    timestamp: '2 hours ago',
    description: 'Added 100,000 Coin Festival Pack with 10% demo bonus to live store.',
    targetId: 'PKG-701',
  },
  {
    id: 'AUD-909',
    adminName: 'Sarah Jenkins',
    adminRole: 'Content Manager',
    actionType: 'Dispatched Demo Push',
    module: 'News, Languages & Push',
    timestamp: '2.5 hours ago',
    description: 'Dispatched test push notification to Host Segment (8,420 targets).',
    targetId: 'CMP-702',
  },
  {
    id: 'AUD-910',
    adminName: 'Farhan Ali',
    adminRole: 'Support Agent',
    actionType: 'Dismissed False Report',
    module: 'Report Queue',
    timestamp: '3 hours ago',
    description: 'Closed report #REP-392 after video inspection showed no community breach.',
    targetId: 'REP-392',
  },
  {
    id: 'AUD-911',
    adminName: 'Bilal Khan',
    adminRole: 'Moderator',
    actionType: 'Terminated Violation Stream',
    module: 'Live Monitor',
    timestamp: '4 hours ago',
    description: 'Force-ended unmoderated party room stream #880901 with 24h host timeout.',
    targetId: 'ROOM-880901',
  },
  {
    id: 'AUD-912',
    adminName: 'Ayesha Noor',
    adminRole: 'Super Admin',
    actionType: 'Added Language Localization',
    module: 'News, Languages & Push',
    timestamp: '5 hours ago',
    description: 'Initiated Bengali (bn) translation pack and staged 25 initial dictionary keys.',
    targetId: 'LANG-BN',
  },
  {
    id: 'AUD-913',
    adminName: 'Tariq Mehmood',
    adminRole: 'Finance Manager',
    actionType: 'Approved Agency Payout',
    module: 'Agency & Payout Admin',
    timestamp: '6 hours ago',
    description: 'Approved monthly commission payment for Alpha Talent Management ($12,450).',
    targetId: 'AG-1001',
  },
  {
    id: 'AUD-914',
    adminName: 'Zainab Qureshi',
    adminRole: 'Moderator',
    actionType: 'Reviewed Age Gate Case',
    module: 'Child Safety Operations',
    timestamp: '7 hours ago',
    description: 'Verified government passport verification for newly registered host.',
    targetId: 'SAFE-098',
  },
  {
    id: 'AUD-915',
    adminName: 'Sarah Jenkins',
    adminRole: 'Content Manager',
    actionType: 'Created Gift Animation',
    module: 'Content & Economy Admin',
    timestamp: '8 hours ago',
    description: 'Uploaded SVG/Lottie asset for new "Diamond Fireworks" luxury virtual gift.',
    targetId: 'GFT-801',
  },
];

// 8 Quick Navigation Cards Linking to Phase 10 Modules
export const QUICK_NAV_ITEMS: QuickNavModuleItem[] = [
  {
    id: 'nav-10-1',
    moduleCode: '10.1',
    title: 'Admin Home & Roles',
    description: 'Role-based access control, admin users directory, and permission matrix governance.',
    iconName: 'Shield',
    targetSection: 'admins',
    badge: '10 Admins',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    statsSummary: '6 Defined Roles · 10 Active Admins',
  },
  {
    id: 'nav-10-2',
    moduleCode: '10.2',
    title: 'User & Host Admin',
    description: 'Manage 1.2M+ registered users, approve host applications, and oversee earning tiers.',
    iconName: 'Users',
    targetSection: 'users',
    badge: '1.2M Users',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    statsSummary: '8,420 Active Hosts · 380 Pending',
  },
  {
    id: 'nav-10-3',
    moduleCode: '10.3',
    title: 'Live Monitor',
    description: 'Real-time multi-grid live stream oversight, audio booth control, and viewer tracking.',
    iconName: 'Radio',
    targetSection: 'live_monitor',
    badge: '1,264 Live',
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    statsSummary: '256k Active Viewers · Peak 384k',
  },
  {
    id: 'nav-10-4',
    moduleCode: '10.4',
    title: 'Report Queue',
    description: 'Investigate user and host complaints, assign severity tiers, and log moderation penalties.',
    iconName: 'ShieldAlert',
    targetSection: 'reports',
    badge: '32 Pending',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    statsSummary: '56 Total Reports · 8 Resolved Today',
  },
  {
    id: 'nav-10-5',
    moduleCode: '10.5',
    title: 'Child Safety Operations',
    description: 'Zero-tolerance child safety console, age verification gates, and emergency escalation protocols.',
    iconName: 'Lock',
    targetSection: 'safety',
    badge: '4 Critical',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    statsSummary: '14 Open Cases · 100% Age Compliant',
  },
  {
    id: 'nav-10-6',
    moduleCode: '10.6',
    title: 'Content & Economy Admin',
    description: 'Virtual store inventory, luxury gift FX, coin package bundles, and platform financial settings.',
    iconName: 'Coins',
    targetSection: 'economy',
    badge: '98.5M Coins',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    statsSummary: '44 Gifts · 8 Coin Packs · 16 Virtual Items',
  },
  {
    id: 'nav-10-7',
    moduleCode: '10.7',
    title: 'Agency, Seller & Payout Admin',
    description: 'Agency guild affiliations, coin seller authorizations, and bank transfer payout disbursements.',
    iconName: 'Building2',
    targetSection: 'agency',
    badge: '22 Claims',
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    statsSummary: '24 Agencies · 38 Sellers · $48.2k Pending',
  },
  {
    id: 'nav-10-8',
    moduleCode: '10.8',
    title: 'News, Languages & Push Admin',
    description: 'In-app editorial announcements, 8-language localization dictionary, and push notification campaigns.',
    iconName: 'Newspaper',
    targetSection: 'news',
    badge: '8 Languages',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    statsSummary: '21 Articles · 92% Localization · 1.4M Reach',
  },
];
