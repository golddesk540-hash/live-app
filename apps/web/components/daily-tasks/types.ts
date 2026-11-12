export type TaskCategoryId = 'live_streaming' | 'gift_activity' | 'community';

export type TaskStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Locked';

export type TaskViewTab = 'all' | 'active' | 'completed';

export type TaskIconKey =
  | 'video'
  | 'clock'
  | 'flame'
  | 'gift'
  | 'sparkles'
  | 'users'
  | 'radio'
  | 'message';

export type DailyTaskEmptyKind =
  | 'no_tasks'
  | 'no_completed'
  | 'no_active'
  | 'no_search_results'
  | 'no_category_tasks';

export interface DailyHostProfile {
  hostName: string;
  username: string;
  hostId: string;
  avatarUrl: string;
  sampleDateLabel: string;
}

export interface DailyTaskItem {
  id: string;
  title: string;
  description: string;
  category: TaskCategoryId;
  categoryLabel: string;
  iconKey: TaskIconKey;
  currentProgress: number;
  targetProgress: number;
  unit: string;
  stepIncrement: number;
  status: TaskStatus;
  taskDate: string;
  completedDate: string | null;
  instructions: string[];
  unlockRequirementLabel?: string;
}

export interface DailyTaskSummaryMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
  lockedTasks: number;
  activeTasks: number;
  remainingTasks: number;
  overallPercentage: number;
}
