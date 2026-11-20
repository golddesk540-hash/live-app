/**
 * POPO LIVE — PARTY VOICE/VIDEO INFRASTRUCTURE TYPES
 * 
 * Defines 9-seat voice room roles, audio permissions, tokens, and webhooks.
 */

export type PartyParticipantRole = 'host' | 'speaker' | 'listener';

export interface PartyAudioPermissions {
  canPublishAudio: boolean;
  canPublishVideo: boolean;
  canSubscribe: boolean;
  canMuteOthers: boolean;
  canKick: boolean;
  seatNumber: number | null;
}

export interface PartyRoomToken {
  token: string;
  roomId: string;
  roomNumber: string;
  userId: string;
  role: PartyParticipantRole;
  seatNumber: number | null;
  permissions: PartyAudioPermissions;
  sfuEndpoint: string;
  expiresAt: string;
}

export interface PartyWebhookEvent {
  event: 'participant_joined' | 'participant_left' | 'track_published' | 'track_unpublished';
  roomId: string;
  userId: string;
  seatNumber?: number | null;
  trackType?: 'audio' | 'video';
  timestamp: string;
}
