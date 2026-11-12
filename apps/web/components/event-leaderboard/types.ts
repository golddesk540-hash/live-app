export type EventStatus = 'live' | 'upcoming' | 'completed';

export type EventStatusFilter = 'all' | EventStatus;

export type LeaderboardFilterTab = 'overall' | 'by_points';

export type EventSortDirection = 'points_desc' | 'points_asc';

export type EventMovement = 'up' | 'down' | 'same' | 'new';

export type EventEmptyKind =
  | 'no_events'
  | 'no_upcoming'
  | 'no_live'
  | 'no_completed'
  | 'no_participants'
  | 'no_search_results'
  | 'my_event_ranking_unavailable';

export interface EventParticipantRecord {
  id: string;
  participantId: string;
  rank: number;
  username: string;
  shortName: string;
  handle: string;
  avatarUrl: string;
  verified: boolean;
  level: number;
  eventPoints: number;
  movement: EventMovement;
  movementDelta: number;
  participationStatus: 'Active' | 'Registered' | 'Finalized';
  countryLabel: string;
  bio: string;
  isCurrentUser?: boolean;
}

export interface EventRecord {
  id: string;
  title: string;
  category: string;
  shortDescription: string;
  fullDescription: string;
  bannerImageUrl: string;
  startDate: string;
  endDate: string;
  periodLabel: string;
  status: EventStatus;
  featured: boolean;
  participantCount: number;
  totalEventPoints: number;
  rules: string[];
  participants: EventParticipantRecord[];
}
