export type TaskLevelStatus = 'Completed' | 'Current' | 'Upcoming' | 'Locked';

export type TaskLevelViewTab = 'overview' | 'benefits' | 'history';

export type TaskLevelFilterMode = 'all' | TaskLevelStatus;

export type LevelEmptyKind =
  | 'no_history'
  | 'no_benefits'
  | 'no_completed'
  | 'no_upcoming'
  | 'no_level_details';

export interface HostLevelHostProfile {
  hostName: string;
  username: string;
  hostId: string;
  avatarUrl: string;
  sampleDateLabel: string;
}

export interface TaskLevelDefinition {
  id: string;
  levelNumber: number;
  levelCode: string; // e.g. 'Level 03'
  name: string;
  minPoints: number;
  targetPoints: number;
  description: string;
  iconKey: 'sprout' | 'zap' | 'star' | 'flame' | 'crown';
  sampleMilestones: string[];
}

export interface ComputedTaskLevelItem extends TaskLevelDefinition {
  status: TaskLevelStatus;
  progressPercent: number;
  remainingPoints: number;
}

export interface TaskLevelBenefit {
  id: string;
  title: string;
  description: string;
  associatedLevelNumber: number;
  associatedLevelLabel: string;
  iconKey: 'award' | 'shield' | 'sparkles' | 'users' | 'crown';
}

export interface TaskLevelHistoryRecord {
  id: string;
  previousLevelLabel: string;
  newLevelLabel: string;
  achievementDate: string;
  pointsAtAchievement: number;
  achievementStatus: 'Achieved (Demo)' | 'Achieved';
}
