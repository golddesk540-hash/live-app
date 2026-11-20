/**
 * POPO LIVE — PARTY MEDIA PROVIDER & SFU TOKEN ENGINE
 * 
 * Manages:
 * - Scoped room token issuance for 9-seat voice rooms
 * - Role-based audio publish permissions (host / speaker / listener)
 * - Track mute/unmute enforcement server-side
 * - Force-kick audio unsubscription
 * - Webhook signature verification
 */

import crypto from 'crypto';
import {
  PartyParticipantRole,
  PartyAudioPermissions,
  PartyRoomToken,
} from './partyMediaTypes';

const AUTH_SECRET = process.env.AUTH_SECRET || 'poppo-live-auth-secret-super-secure-key-2026';
const PARTY_WEBHOOK_SECRET = process.env.PARTY_WEBHOOK_SECRET || 'poppo-live-party-webhook-secret-2026';

export class PartyMediaProviderService {
  private sfuEndpoint: string;
  private revokedTokens: Set<string> = new Set();
  private closedRooms: Set<string> = new Set();
  private mutedTracks: Map<string, boolean> = new Map(); // key: `${roomId}:${seatNumber}` -> isMuted

  constructor() {
    this.sfuEndpoint = process.env.PARTY_SFU_ENDPOINT || 'wss://sfu.popolive.com/party';
  }

  public isRealPartyMediaEnabled(): boolean {
    return process.env.USE_REAL_PARTY_MEDIA === 'true';
  }

  /**
   * Generates a signed, role-scoped SFU room token
   */
  public generateRoomToken(
    roomId: string,
    roomNumber: string,
    userId: string,
    role: PartyParticipantRole,
    seatNumber: number | null,
    ttlSeconds = 3600
  ): PartyRoomToken {
    const expiresAtSeconds = Math.floor(Date.now() / 1000) + ttlSeconds;
    const expiresAt = new Date(expiresAtSeconds * 1000).toISOString();

    const permissions: PartyAudioPermissions = {
      canPublishAudio: role === 'host' || role === 'speaker',
      canPublishVideo: false, // Voice-first design
      canSubscribe: true,
      canMuteOthers: role === 'host',
      canKick: role === 'host',
      seatNumber,
    };

    const tokenPayload = {
      roomId,
      roomNumber,
      userId,
      role,
      seatNumber,
      permissions,
      expiresAt: expiresAtSeconds,
      nonce: crypto.randomBytes(8).toString('hex'),
    };

    const encoded = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(encoded)
      .digest('base64url');

    const token = `party_${encoded}.${signature}`;

    return {
      token,
      roomId,
      roomNumber,
      userId,
      role,
      seatNumber,
      permissions,
      sfuEndpoint: this.sfuEndpoint,
      expiresAt,
    };
  }

  /**
   * Verifies and decodes a party room token
   */
  public verifyRoomToken(token: string): { valid: boolean; payload?: any; reason?: string } {
    if (!token || typeof token !== 'string' || !token.startsWith('party_')) {
      return { valid: false, reason: 'INVALID_TOKEN_FORMAT' };
    }

    if (this.revokedTokens.has(token)) {
      return { valid: false, reason: 'TOKEN_REVOKED' };
    }

    const raw = token.substring(6);
    const dotIndex = raw.lastIndexOf('.');
    if (dotIndex <= 0) {
      return { valid: false, reason: 'INVALID_SIGNATURE_DELIMITER' };
    }

    const payloadPart = raw.substring(0, dotIndex);
    const signaturePart = raw.substring(dotIndex + 1);

    const expectedSig = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(payloadPart)
      .digest('base64url');

    if (signaturePart !== expectedSig) {
      return { valid: false, reason: 'INVALID_SIGNATURE' };
    }

    try {
      const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf-8'));
      const nowSeconds = Math.floor(Date.now() / 1000);

      if (payload.expiresAt && nowSeconds > payload.expiresAt) {
        return { valid: false, reason: 'TOKEN_EXPIRED' };
      }

      if (this.closedRooms.has(payload.roomId)) {
        return { valid: false, reason: 'ROOM_CLOSED' };
      }

      return { valid: true, payload };
    } catch (_) {
      return { valid: false, reason: 'MALFORMED_PAYLOAD' };
    }
  }

  /**
   * Sets server-side microphone mute status for an active seat
   */
  public setSeatAudioTrackState(roomId: string, seatNumber: number, isMuted: boolean): boolean {
    const key = `${roomId}:${seatNumber}`;
    this.mutedTracks.set(key, isMuted);
    return !isMuted; // returns audioEnabled
  }

  public isSeatAudioEnabled(roomId: string, seatNumber: number): boolean {
    const key = `${roomId}:${seatNumber}`;
    return !Boolean(this.mutedTracks.get(key));
  }

  /**
   * Forces participant audio disconnection (kick)
   */
  public forceKickParticipant(roomId: string, seatNumber: number, userId?: string): boolean {
    this.setSeatAudioTrackState(roomId, seatNumber, true); // force mute
    return true;
  }

  /**
   * Invalidates all tokens for a closed or terminated room
   */
  public invalidateRoom(roomId: string): void {
    this.closedRooms.add(roomId);
  }

  /**
   * Inbound Webhook Signature Verification
   */
  public verifyWebhookSignature(payloadString: string, signatureHeader?: string | null): boolean {
    if (!signatureHeader) return false;
    const expected = crypto
      .createHmac('sha256', PARTY_WEBHOOK_SECRET)
      .update(payloadString)
      .digest('hex');
    return signatureHeader === expected;
  }

  public signWebhookPayload(payloadString: string): string {
    return crypto
      .createHmac('sha256', PARTY_WEBHOOK_SECRET)
      .update(payloadString)
      .digest('hex');
  }
}

export const partyMediaProvider = new PartyMediaProviderService();
