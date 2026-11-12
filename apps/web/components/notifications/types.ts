import { InboxUserProfile } from '../inbox/types';

export type NotificationCategoryId =
  | 'all'
  | 'likes'
  | 'comments'
  | 'followers'
  | 'mentions'
  | 'fan_club'
  | 'invites'
  | 'live';

export type NotificationType = Exclude<NotificationCategoryId, 'all'>;

export interface NotificationPreferenceState {
  likes: boolean;
  comments: boolean;
  followers: boolean;
  mentions: boolean;
  fan_club: boolean;
  invites: boolean;
  live: boolean;
}

export interface ActivityNotificationAction {
  label: string;
  href?: string;
  actionKind:
    | 'follow_back'
    | 'open_post'
    | 'open_comments'
    | 'open_fan_club'
    | 'open_invite'
    | 'open_live_preview';
}

export interface ActivityNotificationItem {
  id: string;
  type: NotificationType;
  categoryLabel: string;
  title: string;
  description: string;
  fullMessage: string[];
  sender: InboxUserProfile;
  ringColor: InboxUserProfile['ringColor'];
  timestamp: string;
  publicationDate: string;
  publicationTime: string;
  isRead: boolean;
  postId?: string;
  postPreviewText?: string;
  postThumbnailUrl?: string;
  commentPreview?: string;
  clubId?: string;
  clubName?: string;
  inviteRoomTitle?: string;
  inviteCode?: string;
  liveRoomId?: string;
  liveRoomTitle?: string;
  liveViewerCount?: number;
  liveTags?: string[];
  action: ActivityNotificationAction;
}
