/**
 * POPO LIVE — PUSH NOTIFICATIONS & DEVICE TOKEN TYPES
 * Supports FCM, APNs, Web Push, Deep Links, In-App Delivery, and Preferences
 */

export type PushNotificationType =
  | 'direct_message'
  | 'gift_received'
  | 'live_start'
  | 'party_invite'
  | 'vip_expiry'
  | 'reward_claimable'
  | 'community_activity'
  | 'system_notice'
  | 'ticket_reply';

export type PushPlatform = 'android' | 'ios' | 'web';

export type PushDeliveryStatus =
  | 'sent'
  | 'mock_sent'
  | 'suppressed_by_flag'
  | 'suppressed_by_preference'
  | 'suppressed_by_block'
  | 'suppressed_by_quiet_hours'
  | 'suppressed_in_app_read'
  | 'suppressed_by_rate_limit'
  | 'failed';

export interface DeviceTokenRecord {
  id: string;
  userId: string;
  deviceToken: string;
  platform: PushPlatform;
  deviceModel?: string;
  appVersion?: string;
  isActive: boolean;
  createdAt: string;
  lastActiveAt: string;
}

export interface UserNotificationPreferences {
  userId: string;
  directMessages: boolean;
  giftAlerts: boolean;
  liveBroadcasts: boolean;
  partyAlerts: boolean;
  vipAlerts: boolean;
  rewardAlerts: boolean;
  communityAlerts: boolean;
  systemNotices: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string;   // "07:00"
  updatedAt: string;
}

export interface PushPayload {
  title: string;
  body: string;
  deepLink: string;
  data?: Record<string, any>;
  senderId?: string;
  badgeCount?: number;
  isSensitive?: boolean;
}

export interface SendPushParams {
  userId: string;
  type: PushNotificationType;
  payload: PushPayload;
  senderId?: string;
  messageId?: string;
  isAlreadyReadInApp?: boolean;
}

export interface PushDispatchLog {
  id: string;
  userId: string;
  deviceToken?: string;
  notificationType: PushNotificationType;
  title: string;
  body: string;
  deepLink: string;
  payload: Record<string, any>;
  status: PushDeliveryStatus;
  suppressionReason?: string;
  createdAt: string;
}

export interface DeliveryReceipt {
  messageId: string;
  deviceToken: string;
  status: 'delivered' | 'failed' | 'invalid_token';
  timestamp: string;
  errorCode?: string;
}
