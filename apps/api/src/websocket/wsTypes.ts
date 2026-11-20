/**
 * POPO LIVE — REAL-TIME WEBSOCKET PROTOCOL & TYPE DEFINITIONS
 * 
 * Defines channels, client events, server broadcasts, and payload contracts.
 */

export type WsChannelType = 'live' | 'party' | 'dm' | 'user';

export interface WsUserSession {
  userId: string;
  poppoId: string;
  nickname: string;
  avatarUrl: string;
  role: string;
  expiresAt: number; // Unix timestamp in seconds
}

export interface WsChatMessage {
  id: string;
  channel: string;
  roomId?: string;
  convId?: string;
  senderId: string;
  senderNickname: string;
  senderAvatar: string;
  senderRole?: string;
  messageText: string;
  emoji?: string;
  createdAt: string;
}

export interface WsGiftInfo {
  id: string;
  name: string;
  coins: number;
  icon?: string;
  imageUrl?: string;
  animationUrl?: string | null;
}

export interface WsSenderInfo {
  id: string;
  nickname: string;
  avatar: string;
  poppoId?: string;
  vipBadge?: string | null;
}

export interface WsGiftAlertPayload {
  roomId: string;
  gift: WsGiftInfo;
  sender: WsSenderInfo;
  hostShare: number;
  roomNumber?: string;
  timestamp: string;
}

export interface WsSeatInfo {
  seatNumber: number;
  participantId: string | null;
  participantName: string | null;
  participantAvatar: string | null;
  isHost: boolean;
  isMuted: boolean;
  isCameraOn: boolean;
  status: 'available' | 'occupied' | 'locked';
}

export interface WsNotificationPayload {
  type: string;
  title?: string;
  body?: string;
  payload?: any;
  timestamp: string;
}

// Client -> Server Inbound Events
export type WsInboundEventType =
  | 'ws:join_live'
  | 'ws:leave_live'
  | 'ws:join_party'
  | 'ws:leave_party'
  | 'ws:join_dm'
  | 'ws:typing'
  | 'ws:chat_message'
  | 'ws:ping';

// Server -> Client Outbound Events
export type WsOutboundEventType =
  | 'ws:authenticated'
  | 'ws:chat_message'
  | 'ws:gift_alert'
  | 'ws:viewer_count'
  | 'ws:seat_update'
  | 'ws:notification'
  | 'ws:typing_start'
  | 'ws:typing_stop'
  | 'ws:pong'
  | 'ws:error';

export interface WsInboundMessage {
  event: WsInboundEventType;
  data?: any;
  messageId?: string;
}

export interface WsOutboundMessage<T = any> {
  event: WsOutboundEventType;
  data: T;
  timestamp: string;
}
