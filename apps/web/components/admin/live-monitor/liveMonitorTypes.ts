export type LiveSessionStatus = 'Live' | 'Ending' | 'Ended' | 'Interrupted';

export type LiveSessionCategory =
  | 'All'
  | 'Chat'
  | 'Music'
  | 'Gaming'
  | 'Entertainment'
  | 'Party Room'
  | 'Talent'
  | 'Other';

export type LiveSessionType = 'Public' | 'Private' | 'Party Room' | 'PK Battle';

export type ViewerStatus = 'VIP' | 'Regular' | 'Moderator' | 'Admin Guest';

export interface LiveViewerRecord {
  id: string;
  username: string;
  nickname: string;
  avatar: string;
  wealthLevel: number;
  viewerStatus: ViewerStatus;
  joinTime: string;
  coinsSpent: number;
}

export interface LiveActivityEvent {
  id: string;
  sessionId: string;
  hostId: string;
  hostUsername: string;
  eventType:
    | 'session_started'
    | 'viewers_joined'
    | 'viewer_milestone'
    | 'title_updated'
    | 'pk_battle_start'
    | 'status_changed'
    | 'session_ended';
  title: string;
  description: string;
  timestamp: string;
  highlightColor?: string;
}

export interface LiveSessionRecord {
  id: string;
  roomNumber: string;
  hostId: string;
  hostUsername: string;
  hostNickname: string;
  hostAvatar: string;
  hostLevel: string;
  hostTier: string;
  hostVerificationStatus: 'Verified' | 'Pending' | 'Unverified';
  hostAccountStatus: 'Active' | 'Pending' | 'Inactive' | 'Suspended';
  sessionTitle: string;
  sessionDescription: string;
  category: LiveSessionCategory;
  sessionType: LiveSessionType;
  status: LiveSessionStatus;
  startTime: string;
  endTime?: string;
  duration: string;
  durationSeconds: number;
  currentViewers: number;
  peakViewers: number;
  totalGiftsReceivedCoins: number;
  previewImageUrl: string;
  hasPreviewFeed: boolean;
  activeViewers: LiveViewerRecord[];
  sessionActivities: LiveActivityEvent[];
  country: string;
  countryCode: string;
  agencyName?: string;
}

export interface LiveSessionHistoryRecord {
  id: string;
  roomNumber: string;
  hostId: string;
  hostUsername: string;
  hostAvatar: string;
  sessionTitle: string;
  category: LiveSessionCategory;
  sessionType: LiveSessionType;
  startTime: string;
  endTime: string;
  duration: string;
  peakViewers: number;
  totalGiftsReceivedCoins: number;
  finalStatus: 'Completed' | 'Ended by Host' | 'Interrupted' | 'Administrative Hold';
}

export interface LiveMonitorMetrics {
  totalActiveSessions: number;
  totalLiveHosts: number;
  totalViewers: number;
  activePartyRooms: number;
  privateSessionsCount: number;
  peakConcurrentViewersToday: number;
  averageSessionDuration: string;
}

export type LiveMonitorSubView = 'dashboard' | 'active_sessions' | 'details' | 'history';
