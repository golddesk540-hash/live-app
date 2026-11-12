export type GuideCategoryId =
  | 'profile_setup'
  | 'live_streaming'
  | 'community_safety'
  | 'host_goals';

export type PackViewMode =
  | 'welcome'
  | 'dashboard'
  | 'profile_setup'
  | 'live_streaming'
  | 'community_safety'
  | 'host_goals'
  | 'progress';

export type PackStepIconKey =
  | 'camera'
  | 'user_check'
  | 'file_text'
  | 'clipboard'
  | 'eye'
  | 'video'
  | 'radio'
  | 'sliders'
  | 'message'
  | 'users'
  | 'shield'
  | 'heart_handshake'
  | 'flag'
  | 'lock'
  | 'sparkles'
  | 'list_todo'
  | 'trophy'
  | 'help';

export type PackEmptyKind =
  | 'no_content'
  | 'no_completed'
  | 'no_pending'
  | 'no_search_results';

export interface GuideCategoryMeta {
  id: GuideCategoryId;
  cardTitle: string;
  cardSubtitle: string;
  sectionTitle: string;
  sectionDescription: string;
  iconKey: PackStepIconKey;
  primaryRouteLabel: string;
  primaryRouteHref: string;
}

export interface LearningStepItem {
  id: string;
  category: GuideCategoryId;
  categoryLabel: string;
  orderIndex: number;
  title: string;
  shortDescription: string;
  instructionContent: string[];
  iconKey: PackStepIconKey;
  relatedRouteLabel: string;
  relatedRouteHref: string;
}

export interface CategoryProgressSummary {
  category: GuideCategoryMeta;
  total: number;
  completed: number;
  pending: number;
  percent: number;
}

export interface PackProgressSummary {
  totalSteps: number;
  completedCount: number;
  pendingCount: number;
  overallPercent: number;
  recommendedNextStep: LearningStepItem | null;
  categories: CategoryProgressSummary[];
}
