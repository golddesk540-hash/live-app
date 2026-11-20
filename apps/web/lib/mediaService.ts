/**
 * POPO LIVE — REAL LIVE STREAMING MEDIA SERVICE (WEB RUNTIME)
 * 
 * Provides unified media handling for:
 * - Starting RTMP streams (Host)
 * - Ending active streams (Host)
 * - Fetching signed HLS playback URLs (Viewer)
 * - 1v1 PK side-by-side stream resolution
 * - Webhook processing
 * - Feature flag gating (USE_REAL_MEDIA)
 */

import crypto from 'crypto';
import { query } from './db';
import { PHASE8_FLAGS } from './phase8Flags';

const AUTH_SECRET = process.env.AUTH_SECRET || 'poppo-live-auth-secret-super-secure-key-2026';
const MEDIA_WEBHOOK_SECRET = process.env.MEDIA_WEBHOOK_SECRET || 'poppo-live-media-webhook-secret-2026';

export interface VideoQualityPreset {
  name: string;
  resolution: string;
  bitrateKbps: number;
  fps: number;
  codec: string;
  targetNetwork: string;
}

export const VIDEO_QUALITY_PRESETS: Record<string, VideoQualityPreset> = {
  FHD_1080P: {
    name: '1080p Full HD',
    resolution: '1920x1080',
    bitrateKbps: 4500,
    fps: 30,
    codec: 'h264',
    targetNetwork: 'Broadband / 5G',
  },
  HD_720P: {
    name: '720p HD (Default)',
    resolution: '1280x720',
    bitrateKbps: 2500,
    fps: 30,
    codec: 'h264',
    targetNetwork: '4G LTE / Stable WiFi',
  },
  SD_480P: {
    name: '480p SD (Data Saver)',
    resolution: '854x480',
    bitrateKbps: 1200,
    fps: 30,
    codec: 'h264',
    targetNetwork: '3G / Mobile Data',
  },
  LOW_360P: {
    name: '360p Low Bandwidth',
    resolution: '640x360',
    bitrateKbps: 600,
    fps: 15,
    codec: 'h264',
    targetNetwork: '2G / Weak Network',
  },
};

export interface RtmpIngestCredentials {
  ingestUrl: string;
  streamKey: string;
  fullRtmpUrl: string;
  expiresAt: string;
  serverRegion: string;
  supportedProtocols: string[];
}

export interface HlsPlaybackInfo {
  roomId: string;
  hlsUrl: string;
  signedHlsUrl: string;
  isLive: boolean;
  expiresAt: string;
  viewerCount: number;
  presets: VideoQualityPreset[];
  lowLatencySupported: boolean;
  watermark?: string;
}

export interface StreamStartResult {
  success: boolean;
  roomId: string;
  roomNumber: string;
  credentials?: RtmpIngestCredentials;
  error?: string;
  code?: string;
}

export interface PlaybackResult {
  success: boolean;
  playback?: HlsPlaybackInfo;
  error?: string;
  code?: string;
}

export class WebMediaService {
  private ingestBaseUrl: string;
  private playbackBaseUrl: string;
  private streamStartAttempts: Map<string, number[]> = new Map();

  constructor() {
    this.ingestBaseUrl = process.env.MEDIA_INGEST_URL || 'rtmps://live.popolive.com:443/live';
    this.playbackBaseUrl = process.env.MEDIA_PLAYBACK_URL || 'https://stream.popolive.com/live';
  }

  public isRealMediaEnabled(): boolean {
    return (
      PHASE8_FLAGS.useRealMedia ||
      process.env.NEXT_PUBLIC_USE_REAL_MEDIA === 'true'
    );
  }

  /**
   * Generates secure RTMP ingest credentials for an authorized host
   */
  public generateIngestCredentials(roomId: string, hostId: string): RtmpIngestCredentials {
    const uniqueSessionId = crypto.randomBytes(12).toString('hex');
    const streamKey = `sk_live_${roomId}_${uniqueSessionId}`;
    const expiresAt = new Date(Date.now() + 86400 * 1000).toISOString();

    return {
      ingestUrl: this.ingestBaseUrl,
      streamKey,
      fullRtmpUrl: `${this.ingestBaseUrl}/${streamKey}`,
      expiresAt,
      serverRegion: process.env.MEDIA_SERVER_REGION || 'ap-south-1 (Karachi Edge)',
      supportedProtocols: ['RTMP', 'RTMPS', 'SRT'],
    };
  }

  /**
   * Generates signed, CDN-protected HLS playback URL for viewers
   */
  public generatePlaybackInfo(roomId: string, viewerCount = 0): HlsPlaybackInfo {
    const ttlSeconds = 3600;
    const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
    const dataToSign = `${roomId}:${expiresAt}`;
    const signature = crypto.createHmac('sha256', AUTH_SECRET).update(dataToSign).digest('hex');

    const cleanBase = this.playbackBaseUrl.replace(/\/$/, '');
    const hlsUrl = `${cleanBase}/${roomId}/index.m3u8`;
    const signedHlsUrl = `${hlsUrl}?expires=${expiresAt}&signature=${signature}`;

    return {
      roomId,
      hlsUrl,
      signedHlsUrl,
      isLive: true,
      expiresAt: new Date(expiresAt * 1000).toISOString(),
      viewerCount,
      presets: Object.values(VIDEO_QUALITY_PRESETS),
      lowLatencySupported: true,
      watermark: 'POPO LIVE',
    };
  }

  /**
   * Verifies an HLS playback signature and TTL
   */
  public verifyPlaybackSignature(roomId: string, expiresStr: string, signature: string): { valid: boolean; reason?: string } {
    const expiresAt = parseInt(expiresStr, 10);
    if (isNaN(expiresAt)) return { valid: false, reason: 'INVALID_EXPIRY' };

    const now = Math.floor(Date.now() / 1000);
    if (now > expiresAt) return { valid: false, reason: 'TOKEN_EXPIRED' };

    const dataToSign = `${roomId}:${expiresAt}`;
    const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(dataToSign).digest('hex');

    if (signature !== expectedSig) return { valid: false, reason: 'INVALID_SIGNATURE' };
    return { valid: true };
  }

  /**
   * Verifies inbound provider webhook signature (HMAC-SHA256)
   */
  public verifyWebhookSignature(payloadString: string, signatureHeader?: string | null): boolean {
    if (!signatureHeader) return false;
    const expected = crypto
      .createHmac('sha256', MEDIA_WEBHOOK_SECRET)
      .update(payloadString)
      .digest('hex');
    return signatureHeader === expected;
  }

  /**
   * Signs a webhook payload string
   */
  public signWebhookPayload(payloadString: string): string {
    return crypto
      .createHmac('sha256', MEDIA_WEBHOOK_SECRET)
      .update(payloadString)
      .digest('hex');
  }

  /**
   * Rate limits stream starts
   */
  public checkStreamStartRateLimit(hostId: string): boolean {
    const now = Date.now();
    const windowMs = 60000;
    const maxAttempts = 5;

    const timestamps = this.streamStartAttempts.get(hostId) || [];
    const valid = timestamps.filter((t) => now - t < windowMs);

    if (valid.length >= maxAttempts) return false;

    valid.push(now);
    this.streamStartAttempts.set(hostId, valid);
    return true;
  }

  /**
   * Starts a live video stream after enforcing Age 18+ and Wealth Level 5
   */
  public async startStream(roomId: string, hostId: string): Promise<StreamStartResult> {
    if (!this.checkStreamStartRateLimit(hostId)) {
      return {
        success: false,
        roomId,
        roomNumber: '',
        error: 'Too many stream start attempts. Please wait a minute before retrying.',
        code: 'RATE_LIMIT_EXCEEDED',
      };
    }

    const hostRows = await query(
      `SELECT id, birthdate, is_adult_verified, wealth_level, status
       FROM popolive.users
       WHERE id = $1
       LIMIT 1`,
      [hostId]
    );

    if (hostRows.length === 0) {
      return {
        success: false,
        roomId,
        roomNumber: '',
        error: 'Host user not found.',
        code: 'USER_NOT_FOUND',
      };
    }

    const host = hostRows[0];
    if (host.status !== 'active') {
      return {
        success: false,
        roomId,
        roomNumber: '',
        error: `Account is ${host.status}. Broadcasting privileges revoked.`,
        code: 'ACCOUNT_NOT_ACTIVE',
      };
    }

    let isAdult = Boolean(host.is_adult_verified);
    if (!isAdult && host.birthdate) {
      const birth = new Date(host.birthdate);
      const age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      isAdult = age >= 18;
    }

    if (!isAdult) {
      return {
        success: false,
        roomId,
        roomNumber: '',
        error: 'Minimum age of 18 is required to broadcast.',
        code: 'AGE_VERIFICATION_FAILED',
      };
    }

    const wealthLevel = Number(host.wealth_level) || 1;
    if (wealthLevel < 5) {
      return {
        success: false,
        roomId,
        roomNumber: '',
        error: `Wealth Level 5 is required to go live. Current level: ${wealthLevel}.`,
        code: 'WEALTH_LEVEL_INSUFFICIENT',
      };
    }

    const roomRows = await query(
      `SELECT id, room_number, host_id, status, is_live
       FROM popolive.live_rooms
       WHERE id = $1
       LIMIT 1`,
      [roomId]
    );

    if (roomRows.length === 0) {
      return {
        success: false,
        roomId,
        roomNumber: '',
        error: 'Live room not found.',
        code: 'ROOM_NOT_FOUND',
      };
    }

    const room = roomRows[0];
    if (room.host_id.toString() !== hostId.toString()) {
      return {
        success: false,
        roomId,
        roomNumber: room.room_number,
        error: 'Only the designated room host can start streaming.',
        code: 'FORBIDDEN_NOT_ROOM_HOST',
      };
    }

    const credentials = this.generateIngestCredentials(roomId, hostId);

    await query(
      `UPDATE popolive.live_rooms
       SET status = 'live',
           is_live = true,
           stream_key = $1,
           started_at = COALESCE(started_at, CURRENT_TIMESTAMP),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [credentials.streamKey, roomId]
    );

    return {
      success: true,
      roomId,
      roomNumber: room.room_number,
      credentials,
    };
  }

  /**
   * Ends an active live stream
   */
  public async endStream(roomId: string, hostId: string): Promise<{ success: boolean; error?: string }> {
    const roomRows = await query(
      `SELECT id, host_id FROM popolive.live_rooms WHERE id = $1 LIMIT 1`,
      [roomId]
    );

    if (roomRows.length === 0) {
      return { success: false, error: 'Room not found.' };
    }

    const room = roomRows[0];
    if (room.host_id.toString() !== hostId.toString()) {
      return { success: false, error: 'Only the room host can terminate this stream.' };
    }

    await query(
      `UPDATE popolive.live_rooms
       SET status = 'ended',
           is_live = false,
           stream_key = NULL,
           ended_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [roomId]
    );

    return { success: true };
  }

  /**
   * Retrieves signed HLS playback info for viewers
   */
  public async getPlayback(roomId: string): Promise<PlaybackResult> {
    const roomRows = await query(
      `SELECT id, room_number, status, is_live, viewer_count, is_pk, current_pk_id
       FROM popolive.live_rooms
       WHERE id = $1 OR room_number = $1
       LIMIT 1`,
      [roomId]
    );

    if (roomRows.length === 0) {
      return {
        success: false,
        error: 'Room not found.',
        code: 'ROOM_NOT_FOUND',
      };
    }

    const room = roomRows[0];
    if (!room.is_live && room.status !== 'live') {
      return {
        success: false,
        error: 'Live stream has ended.',
        code: 'STREAM_ENDED',
      };
    }

    const playback = this.generatePlaybackInfo(room.id, room.viewer_count || 0);

    return {
      success: true,
      playback,
    };
  }

  /**
   * Processes inbound webhook from media provider
   */
  public async handleWebhook(event: any): Promise<{ handled: boolean; action: string }> {
    switch (event.event) {
      case 'stream.started':
        await query(
          `UPDATE popolive.live_rooms
           SET status = 'live', is_live = true, updated_at = CURRENT_TIMESTAMP
           WHERE stream_key = $1 OR id::text = $2`,
          [event.streamKey, event.roomId]
        );
        return { handled: true, action: 'ROOM_MARKED_LIVE' };

      case 'stream.ended':
        await query(
          `UPDATE popolive.live_rooms
           SET status = 'ended', is_live = false, ended_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
           WHERE stream_key = $1 OR id::text = $2`,
          [event.streamKey, event.roomId]
        );
        return { handled: true, action: 'ROOM_MARKED_ENDED' };

      case 'stream.failed':
        await query(
          `UPDATE popolive.live_rooms
           SET status = 'failed', is_live = false, updated_at = CURRENT_TIMESTAMP
           WHERE stream_key = $1 OR id::text = $2`,
          [event.streamKey, event.roomId]
        );
        return { handled: true, action: 'ROOM_MARKED_FAILED' };

      case 'stream.viewer_update':
        if (typeof event.details?.viewerCount === 'number') {
          await query(
            `UPDATE popolive.live_rooms
             SET viewer_count = $1, updated_at = CURRENT_TIMESTAMP
             WHERE stream_key = $2 OR id::text = $3`,
            [event.details.viewerCount, event.streamKey, event.roomId]
          );
          return { handled: true, action: 'VIEWER_COUNT_UPDATED' };
        }
        return { handled: true, action: 'NO_OP' };

      default:
        return { handled: false, action: 'UNKNOWN_EVENT' };
    }
  }

  /**
   * Resolves 1v1 PK dual-stream playback
   */
  public async getPkPlayback(pkBattleId: string): Promise<any> {
    const pkRows = await query(
      `SELECT id, room_id, host_a_id, host_b_id, status
       FROM popolive.pk_activities
       WHERE id = $1
       LIMIT 1`,
      [pkBattleId]
    );

    if (pkRows.length === 0) {
      return { success: false, error: 'PK Battle not found' };
    }

    const pk = pkRows[0];
    const hostAPlayback = this.generatePlaybackInfo(`pk_host_a_${pk.host_a_id}`);
    const hostBPlayback = this.generatePlaybackInfo(`pk_host_b_${pk.host_b_id}`);

    return {
      success: true,
      pkBattleId: pk.id,
      status: pk.status,
      layout: 'side_by_side_1v1',
      streams: {
        hostA: hostAPlayback,
        hostB: hostBPlayback,
      },
    };
  }
}

export const mediaService = new WebMediaService();
