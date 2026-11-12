export type AgencySectionTab = 'dashboard' | 'profile' | 'hosts' | 'performance' | 'support';

export type AgencyHostStatus = 'Active' | 'Pending' | 'Inactive' | 'Suspended';

export type HostFilterStatus = 'All' | AgencyHostStatus;

export type HostSortMode = 'default' | 'name_asc' | 'sessions_desc';

export type PerformancePeriod = 'daily' | 'weekly' | 'monthly';

export type AgencyLogoPresetId =
  | 'gold_orbit'
  | 'neon_star'
  | 'violet_crown'
  | 'emerald_crest';

export type AgencyEmptyKind =
  | 'no_agency_info'
  | 'no_hosts'
  | 'no_active_hosts'
  | 'no_pending_hosts'
  | 'no_search_results'
  | 'no_performance_data';

export interface AgencyProfileData {
  agencyId: string;
  agencyName: string;
  status: 'Active agency' | 'Demo Preview';
  description: string;
  ownerName: string;
  ownerHandle: string;
  ownerAvatarUrl: string;
  ownerRole: string;
  contactEmail: string;
  contactPhone: string;
  country: string;
  createdDateLabel: string;
  logoPreset: AgencyLogoPresetId;
  highlights: string[];
}

export interface AgencyHostRecord {
  hostId: string;
  username: string;
  handle: string;
  avatarUrl: string;
  verified: boolean;
  status: AgencyHostStatus;
  joiningDate: string;
  activityStatusLabel: string;
  sampleSessionsThisWeek: number;
  sampleLiveHours: number;
  sampleParticipationScore: number;
  dailyTaskStatusLabel: 'Completed' | 'In Progress' | 'Not Started' | 'Paused (Demo)';
  dailyTaskProgressLabel: string;
  taskLevelCode: string;
  taskLevelName: string;
  countryLabel: string;
  membershipRole: string;
  bio: string;
}

export interface AgencyPerformancePoint {
  label: string;
  sessions: number;
  liveHours: number;
  activeHosts: number;
}

export interface AgencyActivityHistoryItem {
  id: string;
  hostName: string;
  handle: string;
  actionLabel: string;
  timestampLabel: string;
  category: 'Streaming' | 'Tasks' | 'Onboarding' | 'Community';
}

export interface AgencyPerformanceDataset {
  period: PerformancePeriod;
  periodLabel: string;
  totalSessions: number;
  totalLiveHours: number;
  activeHostCount: number;
  participationRate: number;
  summaryText: string;
  chartPoints: AgencyPerformancePoint[];
  activityHistory: AgencyActivityHistoryItem[];
}

export interface AgencyFaqItem {
  id: string;
  category: 'Agency' | 'Hosts' | 'Activity';
  question: string;
  answer: string;
}

export interface AgencyGuidanceItem {
  id: string;
  title: string;
  summary: string;
  steps: string[];
}
