export type AccountStatus = 'Active' | 'Inactive' | 'Suspended' | 'Pending';

export type VerificationStatus = 'Verified' | 'Unverified' | 'Pending';

export type HostActivityStatus = 'Live Now' | 'In Party Room' | 'Offline' | 'Idle';

export interface UserActivityRecord {
  id: string;
  action: string;
  timestamp: string;
  details: string;
  ipAddress?: string;
  device?: string;
  category: 'auth' | 'profile' | 'wallet' | 'social' | 'security';
}

export interface HostActivityRecord {
  id: string;
  action: string;
  timestamp: string;
  details: string;
  durationMinutes?: number;
  viewersPeak?: number;
  pointsEarned?: number;
  category: 'broadcast' | 'task' | 'level' | 'profile' | 'status';
}

export interface AccountStatusChangeRecord {
  id: string;
  previousStatus: AccountStatus;
  newStatus: AccountStatus;
  changedBy: string;
  reason: string;
  timestamp: string;
}

export interface UserProfileRecord {
  id: string; // e.g. U10298462
  username: string; // e.g. User_98462
  nickname: string;
  email: string;
  avatar: string;
  country: string;
  countryCode: string;
  registrationDate: string;
  status: AccountStatus;
  verificationStatus: VerificationStatus;
  bio: string;
  gender: 'Female' | 'Male' | 'Other';
  phoneMasked: string;
  isHost: boolean;
  linkedHostId: string | null;
  wealthLevel: number;
  coinsBalance: number;
  pointsBalance: number;
  loginProvider: 'phone' | 'email' | 'google' | 'apple';
  twoFactor: boolean;
  lastActive: string;
  activityHistory: UserActivityRecord[];
  accountAuditLog: AccountStatusChangeRecord[];
}

export interface HostProfileRecord {
  id: string; // e.g. H3007542
  linkedUserId: string; // e.g. U10298462
  username: string; // e.g. Host_Sara
  nickname: string;
  avatar: string;
  country: string;
  countryCode: string;
  registrationDate: string;
  hostStatus: AccountStatus;
  activityStatus: HostActivityStatus;
  hostLevel: string; // e.g. Tier S, Level 5
  taskLevelTier: 'S' | 'A' | 'B' | 'C';
  dailyTasksCompleted: number;
  dailyTasksTotal: number;
  totalLiveHours: number;
  followersCount: number;
  earnedPoints: number;
  agencyName: string;
  streamCategory: string;
  activityHistory: HostActivityRecord[];
  hostAuditLog: AccountStatusChangeRecord[];
}

export interface UserFilterState {
  searchQuery: string;
  status: string; // 'All' | AccountStatus
  country: string; // 'All' | countryCode
  verificationStatus: string; // 'All' | VerificationStatus
  sortBy: 'registration_desc' | 'registration_asc' | 'username_asc' | 'wealth_desc';
}

export interface HostFilterState {
  searchQuery: string;
  status: string; // 'All' | AccountStatus
  activityStatus: string; // 'All' | HostActivityStatus
  country: string; // 'All' | countryCode
  hostLevel: string; // 'All' | 'Tier S' | 'Tier A' | ...
  sortBy: 'registration_desc' | 'followers_desc' | 'hours_desc' | 'username_asc';
}

export type UserHostActiveTab = 'users' | 'hosts';

export type UserHostSubView = 'dashboard' | 'list' | 'details';
