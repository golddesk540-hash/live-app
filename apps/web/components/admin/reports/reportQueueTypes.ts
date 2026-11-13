export type ReportStatus = 'Pending' | 'Under Review' | 'Resolved' | 'Rejected';

export type ReportPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type ReportCategoryKey =
  | 'community_guidelines'
  | 'language_conduct'
  | 'unsuitable_content'
  | 'unverified_profile'
  | 'spam_promotion'
  | 'impersonation'
  | 'suspicious_activity'
  | 'other';

export type ReportedAccountType = 'User' | 'Host';

export interface ReportCategoryItem {
  key: ReportCategoryKey;
  label: string;
  iconName: string;
  description: string;
  reportCount: number;
  badgeColor: string;
}

export interface ReportEvidenceItem {
  id: string;
  title: string;
  type: 'image' | 'screenshot' | 'chat_log' | 'video_clip';
  url: string;
  thumbnailUrl?: string;
  caption: string;
  timestamp: string;
  fileSize: string;
}

export interface ReportActivityEvent {
  id: string;
  title: string;
  adminName: string;
  adminAvatar?: string;
  timestamp: string;
  description: string;
  status?: ReportStatus;
  badge?: string;
}

export interface ReporterInfo {
  userId: string;
  username: string;
  nickname: string;
  avatar: string;
  accountStatus: 'Active' | 'Suspended' | 'Pending Verification';
  registrationDate: string;
  country: string;
  countryCode: string;
  reportsSubmittedCount: number;
}

export interface ReportedAccountInfo {
  accountId: string;
  username: string;
  nickname: string;
  avatar: string;
  accountType: ReportedAccountType;
  accountStatus: 'Active' | 'Warned' | 'Restricted' | 'Suspended';
  isHost: boolean;
  hostId?: string;
  agencyName?: string;
  hostTier?: string;
  registrationDate: string;
  violationsCount: number;
  country: string;
  countryCode: string;
}

export interface ReportRecord {
  id: string; // e.g. '#RP98421'
  numericId: number;
  category: ReportCategoryKey;
  categoryLabel: string;
  status: ReportStatus;
  priority: ReportPriority;
  shortDescription: string;
  fullDescription: string;
  submittedAt: string;
  submittedRelative: string;
  reporter: ReporterInfo;
  reported: ReportedAccountInfo;
  evidence: ReportEvidenceItem[];
  adminNotes: string;
  reviewHistory: ReportActivityEvent[];
  assignedAdmin?: string;
  lastUpdatedAt: string;
}

export interface ReportQueueMetrics {
  totalReports: number;
  pendingReports: number;
  underReviewReports: number;
  resolvedReports: number;
  rejectedReports: number;
  newReportsToday: number;
  urgentReports: number;
  highPriorityReports: number;
}

export type ReportNavTab = 'dashboard' | 'all' | 'pending' | 'review' | 'resolved' | 'rejected' | 'categories';

export interface ReportFilters {
  searchQuery: string;
  status: ReportStatus | 'All';
  category: ReportCategoryKey | 'All';
  priority: ReportPriority | 'All';
  accountType: 'All' | 'User' | 'Host';
  sortBy: 'newest' | 'oldest' | 'priority_high' | 'priority_low';
  dateRange: 'all' | 'today' | 'this_week' | 'older';
}
