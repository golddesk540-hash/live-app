export type SquareFeedTab = 'for_you' | 'following' | 'popular';

export type SquarePostMediaType = 'none' | 'single_image' | 'two_images' | 'multi_images' | 'video' | 'live_room';

export interface SquareCreator {
  id: string;
  name: string;
  handle: string;
  poppoId: string;
  avatarUrl?: string;
  avatarColor: string;
  ringColor: 'pink' | 'blue' | 'purple' | 'gold' | 'emerald';
  isVerified?: boolean;
  isVip?: boolean;
  level: number;
  roleTag: string;
  bio: string;
  countryFlag: string;
  countryName: string;
  followersCount: string;
  followingCount: string;
  status: 'online' | 'live' | 'offline';
}

export interface CommentReplyItem {
  id: string;
  authorName: string;
  authorAvatarUrl?: string;
  authorInitials: string;
  authorColor: string;
  text: string;
  timestamp: string;
  likes: number;
  isLiked?: boolean;
  isOwn?: boolean;
}

export interface SquareCommentItem {
  id: string;
  authorName: string;
  authorHandle?: string;
  authorAvatarUrl?: string;
  authorInitials: string;
  authorColor: string;
  text: string;
  timestamp: string;
  likes: number;
  isLiked?: boolean;
  isOwn?: boolean;
  replies?: CommentReplyItem[];
}

export interface SquarePostItem {
  id: string;
  creator: SquareCreator;
  publishedAgo: string;
  visibility: 'Public' | 'Followers' | 'Following' | 'Private' | 'VIP Circle';
  text: string;
  hashtags?: string[];
  mediaType: SquarePostMediaType;
  images?: string[];
  videoThumbnailUrl?: string;
  videoPreviewUrl?: string;
  videoDuration?: string;
  videoTitle?: string;
  mediaMetaLabel?: string;
  liveRoomTitle?: string;
  liveRoomHref?: string;
  likesCount: number;
  isLiked: boolean;
  isSaved: boolean;
  sharesCount: number;
  comments: SquareCommentItem[];
  categoryScore: number;
}
