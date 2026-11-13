export type SafetyCaseStatus = 'Pending' | 'Under Review' | 'Escalated' | 'Resolved' | 'Closed';

export type SafetyPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type SafetyAlertCategory =
  | 'age_concern'
  | 'minor_safety'
  | 'potential_minor'
  | 'inappropriate_interaction'
  | 'harassment_concern'
  | 'suspicious_activity'
  | 'policy_concern'
  | 'safety_policy'
  | 'other_safety';

export type SafetyCaseCategory =
  | 'Age Verification Review'
  | 'Underage Stream Flag'
  | 'Inappropriate Interaction'
  | 'Restricted Contact Violation'
  | 'Suspicious Minor Profile'
  | 'Grooming Prevention Alert'
  | 'General Child Safety';

export type SafetyEvidenceType = 'screenshot' | 'image' | 'chat_excerpt' | 'id_document_redacted' | 'system_log';

export interface SafetyEvidenceItem {
  id: string;
  referenceId: string;
  category: string;
  type: SafetyEvidenceType;
  submissionDate: string;
  fileSize: string;
  description: string;
  safeThumbnailUrl: string;
  reviewStatus: 'Pending Review' | 'Audited' | 'Cleared' | 'Sanction Applied';
  isRedacted: boolean;
}

export interface SafetyTimelineEvent {
  id: string;
  title: string;
  adminName: string;
  timestamp: string;
  description: string;
  caseStatus?: SafetyCaseStatus;
  badge?: string;
}

export interface SafetyCaseRecord {
  id: string; // e.g. '#CS-7701'
  numericId: number;
  category: SafetyCaseCategory;
  relatedReportId?: string; // e.g. '#RP98421'
  relatedUserId: string; // e.g. 'U10298462'
  relatedUsername: string;
  relatedUserAvatar: string;
  relatedUserStatus: 'Active' | 'Under Review' | 'Restricted' | 'Suspended';
  isHost: boolean;
  relatedHostId?: string; // e.g. 'H3007612'
  priority: SafetyPriority;
  status: SafetyCaseStatus;
  shortDescription: string;
  fullDescription: string;
  assignedReviewer: string;
  createdDate: string;
  createdRelative: string;
  lastUpdatedDate: string;
  lastUpdatedRelative: string;
  isEscalated: boolean;
  escalationReason?: string;
  escalatedAt?: string;
  reviewerNotes: string;
  evidenceItems: SafetyEvidenceItem[];
  timeline: SafetyTimelineEvent[];
}

export interface SafetyAlertRecord {
  id: string; // e.g. '#ALT-4401'
  category: SafetyAlertCategory;
  categoryLabel: string;
  relatedReportId: string;
  relatedCaseId?: string;
  relatedUserId: string;
  relatedUsername: string;
  createdDate: string;
  createdRelative: string;
  priority: SafetyPriority;
  status: 'Active' | 'Investigating' | 'Dismissed' | 'Actioned';
  shortDescription: string;
  riskScore: number; // 1 to 100
}

export interface SafetyGuidelineItem {
  id: string;
  title: string;
  category: string;
  summary: string;
  keyPoints: string[];
  protocolSteps: string[];
  iconName: string;
}

export interface SafetyMetrics {
  totalCases: number;
  pendingCases: number;
  underReviewCases: number;
  highPriorityCases: number;
  urgentCases: number;
  escalatedCases: number;
  resolvedCases: number;
  closedCases: number;
  activeAlerts: number;
  ageReviewsPending: number;
  restrictedAccountsCount: number;
}

export type SafetyNavTab =
  | 'dashboard'
  | 'alerts'
  | 'age_queue'
  | 'cases'
  | 'high_priority'
  | 'escalations'
  | 'guidelines';

export interface SafetyFilters {
  searchQuery: string;
  status: SafetyCaseStatus | 'All';
  category: SafetyCaseCategory | 'All';
  priority: SafetyPriority | 'All';
  assignedReviewer: string | 'All';
  isEscalatedOnly: boolean;
  sortBy: 'newest' | 'oldest' | 'priority_high' | 'priority_low' | 'recently_updated';
}
