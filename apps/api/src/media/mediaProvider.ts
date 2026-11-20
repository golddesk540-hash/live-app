/**
 * POPO LIVE — REAL LIVE STREAMING MEDIA PROVIDER
 * 
 * Manages:
 * - RTMP/SRT Ingest credentials provisioning
 * - Ephemeral session stream keys
 * - Signed HLS playback URLs with TTL
 * - Webhook signature verification for provider events
 * - Bandwidth and quality adaptation presets
 */

import crypto from 'crypto';
import {
  RtmpIngestCredentials,
  HlsPlaybackInfo,
  VIDEO_QUALITY_PRESETS,
  StreamWebhookEvent,
} from './mediaTypes';

const AUTH_SECRET = process.env.AUTH_SECRET || 'poppo-live-auth-secret-super-secure-key-2026';
const MEDIA_WEBHOOK_SECRET = process.env.MEDIA_WEBHOOK_SECRET || 'poppo-live-media-webhook-secret-2026';

export class MediaProviderService {
  private ingestBaseUrl: string;
  private playbackBaseUrl: string;
  private streamStartAttempts: Map<string, number[]> = new Map();

  constructor() {
    this.ingestBaseUrl = process.env.MEDIA_INGEST_URL || 'rtmps://live.popolive.com:443/live';
    this.playbackBaseUrl = process.env.MEDIA_PLAYBACK_URL || 'https://stream.popolive.com/live';
  }

  public isRealMediaEnabled(): boolean {
    return process.env.USE_REAL_MEDIA === 'true';
  }

  /**
   * Generates secure RTMP ingest credentials for an authorized host
   */
  public generateIngestCredentials(roomId: string, hostId: string): RtmpIngestCredentials {
    // Generate unique session-bound stream key
    const uniqueSessionId = crypto.randomBytes(12).toString('hex');
    const streamKey = `sk_live_${roomId}_${uniqueSessionId}`;
    const expiresAt = new Date(Date.now() + 86400 * 1000).toISOString(); // 24-hour max stream session

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
    const ttlSeconds = 3600; // 1-hour expiration
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
    if (isNaN(expiresAt)) {
      return { valid: false, reason: 'INVALID_EXPIRY' };
    }

    const now = Math.floor(Date.now() / 1000);
    if (now > expiresAt) {
      return { valid: false, reason: 'TOKEN_EXPIRED' };
    }

    const dataToSign = `${roomId}:${expiresAt}`;
    const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(dataToSign).digest('hex');

    if (signature !== expectedSig) {
      return { valid: false, reason: 'INVALID_SIGNATURE' };
    }

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
   * Generates a test webhook signature
   */
  public signWebhookPayload(payloadString: string): string {
    return crypto
      .createHmac('sha256', MEDIA_WEBHOOK_SECRET)
      .update(payloadString)
      .digest('hex');
  }

  /**
   * Enforces stream start rate limiting (max 5 starts per minute)
   */
  public checkStreamStartRateLimit(hostId: string): boolean {
    const now = Date.now();
    const windowMs = 60000;
    const maxAttempts = 5;

    const timestamps = this.streamStartAttempts.get(hostId) || [];
    const valid = timestamps.filter((t) => now - t < windowMs);

    if (valid.length >= maxAttempts) {
      return false; // Rate limited
    }

    valid.push(now);
    this.streamStartAttempts.set(hostId, valid);
    return true;
  }
}

export const mediaProvider = new MediaProviderService();
