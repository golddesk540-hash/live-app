export type UserPresenceStatus = 'online' | 'live' | 'offline';

export type InboxTab = 'chats' | 'contacts' | 'requests';

export type MessageAttachmentType = 'photo' | 'gift' | 'voice' | 'room_invite';

export interface InboxMessageAttachment {
  type: MessageAttachmentType;
  title: string;
  subtitle?: string;
  previewUrl?: string;
  accentLabel?: string;
}

export interface InboxMessage {
  id: string;
  senderId: string; // 'me' for current user, otherwise peer user id
  text: string;
  timestamp: string;
  dateGroup?: string;
  status?: 'sent' | 'delivered' | 'read';
  attachment?: InboxMessageAttachment;
}

export interface InboxUserProfile {
  id: string;
  name: string;
  handle: string;
  poppoId: string;
  avatarUrl?: string;
  avatarColor: string;
  ringColor: 'pink' | 'blue' | 'purple' | 'gold' | 'emerald';
  status: UserPresenceStatus;
  lastSeenText: string;
  bio: string;
  countryFlag: string;
  countryName: string;
  level: number;
  isVip?: boolean;
  isOfficial?: boolean;
  followersCount: string;
  followingCount: string;
  roleTag: string;
}

export interface InboxConversation {
  id: string;
  user: InboxUserProfile;
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
  isPinned?: boolean;
  isMuted?: boolean;
  messages: InboxMessage[];
}

export interface InboxMessageRequest {
  id: string;
  user: InboxUserProfile;
  previewMessage: string;
  receivedAt: string;
  messages: InboxMessage[];
}
