export type RankingPeriod = 'daily' | 'weekly' | 'monthly';

export type RankingCategoryFilter = 'all' | 'verified' | 'rising';

export type RankingSortOrder = 'rank_asc' | 'rank_desc';

export type RankingMovementDirection = 'up' | 'down' | 'same' | 'new';

export type RankingEmptyKind =
  | 'no_data'
  | 'no_hosts_found'
  | 'no_daily'
  | 'no_weekly'
  | 'no_monthly'
  | 'my_ranking_unavailable';

export interface HostRankingEntry {
  id: string;
  hostId: string;
  rank: number;
  username: string;
  shortName: string;
  handle: string;
  avatarUrl: string;
  points: number;
  verified: boolean;
  movement: RankingMovementDirection;
  movementDelta: number;
  level: number;
  countryLabel: string;
  bio: string;
  isCurrentUser?: boolean;
}

export interface PeriodRankingDataset {
  period: RankingPeriod;
  label: string;
  periodWindowLabel: string;
  entries: HostRankingEntry[];
}
