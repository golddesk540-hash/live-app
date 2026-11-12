export type FanClubFilterTab = 'all' | 'featured' | 'popular' | 'recommended' | 'joined';

export type FanClubDetailTab = 'overview' | 'membership' | 'members' | 'updates';

export interface FanClubBenefit {
  id: string;
  title: string;
  subtitle: string;
  iconKey: 'crown' | 'sparkle' | 'heart';
}

export interface FanClubMember {
  id: string;
  name: string;
  handle: string;
  poppoId: string;
  avatarUrl?: string;
  avatarColor: string;
  ringColor: 'pink' | 'blue' | 'purple' | 'gold' | 'emerald';
  badgeTitle: string;
  badgeLevel: number;
  joinedAgo: string;
  isOnline: boolean;
  isCurrentDemoUser?: boolean;
  roleLabel: string;
  bio: string;
  countryFlag: string;
  countryName: string;
  followersCount: string;
  followingCount: string;
  level: number;
  isVip?: boolean;
}

export interface FanClubUpdate {
  id: string;
  title: string;
  message: string;
  authorName: string;
  authorAvatarUrl?: string;
  publishedDate: string;
  timestamp: string;
  tag?: string;
}

export interface FanClubItem {
  id: string;
  name: string;
  hostName: string;
  hostHandle: string;
  hostPoppoId: string;
  hostAvatarUrl?: string;
  hostVerified: boolean;
  hostVip?: boolean;
  hostRole: string;
  coverImageUrl: string;
  description: string;
  memberCount: number;
  clubLevel: number;
  badgeLabel: string;
  accentTone: 'gold' | 'pink' | 'cyan' | 'purple' | 'emerald';
  isFeatured?: boolean;
  isPopular?: boolean;
  isRecommended?: boolean;
  benefits: FanClubBenefit[];
  members: FanClubMember[];
  updates: FanClubUpdate[];
}

export interface JoinedClubRecord {
  clubId: string;
  clubName: string;
  hostName: string;
  badgeLabel: string;
  clubLevel: number;
  joinedDateLabel: string;
}
