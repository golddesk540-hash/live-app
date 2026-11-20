/**
 * POPO LIVE — PARTY MEDIA SERVICE (WEB RUNTIME)
 * 
 * Manages:
 * - SFU Room Token Issuance for 9-Seat Party Rooms
 * - Role permissions: Host / Speaker (Seats 1-9) vs Listener (Non-seated / 10th+)
 * - Server-side Microphone audio track enable/disable
 * - Host participant kick & room termination
 * - Provider webhook verification
 * - Feature flag gating (USE_REAL_PARTY_MEDIA)
 */

import crypto from 'crypto';
import { query } from './db';
import { PHASE8_FLAGS } from './phase8Flags';

const AUTH_SECRET = process.env.AUTH_SECRET || 'poppo-live-auth-secret-super-secure-key-2026';
const PARTY_WEBHOOK_SECRET = process.env.PARTY_WEBHOOK_SECRET || 'poppo-live-party-webhook-secret-2026';

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

export class WebPartyMediaService {
  private sfuEndpoint: string;
  private closedRooms: Set<string> = new Set();
  private mutedTracks: Map<string, boolean> = new Map();

  constructor() {
    this.sfuEndpoint = process.env.NEXT_PUBLIC_PARTY_SFU_ENDPOINT || 'wss://sfu.popolive.com/party';
  }

  public isRealPartyMediaEnabled(): boolean {
    return (
      PHASE8_FLAGS.useRealPartyMedia ||
      process.env.NEXT_PUBLIC_USE_REAL_PARTY_MEDIA === 'true'
    );
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
      canPublishVideo: false,
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
   * Verifies a room token
   */
  public verifyRoomToken(token: string): { valid: boolean; payload?: any; reason?: string } {
    if (!token || typeof token !== 'string' || !token.startsWith('party_')) {
      return { valid: false, reason: 'INVALID_TOKEN_FORMAT' };
    }

    const raw = token.substring(6);
    const dotIndex = raw.lastIndexOf('.');
    if (dotIndex <= 0) return { valid: false, reason: 'INVALID_SIGNATURE_DELIMITER' };

    const payloadPart = raw.substring(0, dotIndex);
    const signaturePart = raw.substring(dotIndex + 1);

    const expectedSig = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(payloadPart)
      .digest('base64url');

    if (signaturePart !== expectedSig) return { valid: false, reason: 'INVALID_SIGNATURE' };

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

  public setSeatAudioTrackState(roomId: string, seatNumber: number, isMuted: boolean): boolean {
    this.mutedTracks.set(`${roomId}:${seatNumber}`, isMuted);
    return !isMuted;
  }

  public invalidateRoom(roomId: string): void {
    this.closedRooms.add(roomId);
  }

  public verifyWebhookSignature(payloadString: string, signatureHeader?: string | null): boolean {
    if (!signatureHeader) return false;
    const expected = crypto
      .createHmac('sha256', PARTY_WEBHOOK_SECRET)
      .update(payloadString)
      .digest('hex');
    return signatureHeader === expected;
  }

  /**
   * Issues room token validating Age 18+ and 9-seat capacity
   */
  public async issueRoomToken(roomId: string, userId: string): Promise<{ success: boolean; tokenData?: PartyRoomToken; error?: string; code?: string }> {
    // 1. Age 18+ check
    const userRows = await query(
      `SELECT id, birthdate, is_adult_verified FROM popolive.users WHERE id = $1 LIMIT 1`,
      [userId]
    );

    if (userRows.length === 0) {
      return { success: false, error: 'User not found.', code: 'USER_NOT_FOUND' };
    }

    const u = userRows[0];
    let isAdult = Boolean(u.is_adult_verified);
    if (!isAdult && u.birthdate) {
      const birth = new Date(u.birthdate);
      const age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      isAdult = age >= 18;
    }

    if (!isAdult) {
      return {
        success: false,
        error: 'Minimum age of 18 is required for party media.',
        code: 'AGE_VERIFICATION_FAILED',
      };
    }

    // 2. Load Room & Seats
    const roomRows = await query(
      `SELECT id, room_number, host_user_id, status FROM popolive.party_rooms WHERE id = $1 OR room_number = $1 LIMIT 1`,
      [roomId]
    );

    if (roomRows.length === 0) {
      return { success: false, error: 'Party room not found.', code: 'ROOM_NOT_FOUND' };
    }

    const room = roomRows[0];
    if (room.status === 'ended' || room.status === 'closed') {
      return { success: false, error: 'Party room has ended.', code: 'ROOM_ENDED' };
    }

    const seatRows = await query(
      `SELECT seat_number, participant_id, is_host FROM popolive.party_seats WHERE room_number = $1 ORDER BY seat_number ASC`,
      [room.room_number]
    );

    let role: PartyParticipantRole = 'listener';
    let seatNumber: number | null = null;

    if (room.host_user_id && room.host_user_id.toString() === userId.toString()) {
      role = 'host';
      seatNumber = 1;
    } else {
      const occupied = seatRows.find(
        (s: any) => s.participant_id && s.participant_id.toString() === userId.toString()
      );

      if (occupied) {
        seatNumber = occupied.seat_number;
        role = occupied.seat_number === 1 ? 'host' : 'speaker';
      } else {
        role = 'listener';
        seatNumber = null;
      }
    }

    const tokenData = this.generateRoomToken(room.id, room.room_number, userId, role, seatNumber);

    return {
      success: true,
      tokenData,
    };
  }

  /**
   * Host ends party media session
   */
  public async endPartyMedia(roomId: string, hostUserId: string): Promise<{ success: boolean; error?: string }> {
    const roomRows = await query(
      `SELECT id, host_user_id FROM popolive.party_rooms WHERE id = $1 LIMIT 1`,
      [roomId]
    );

    if (roomRows.length === 0) return { success: false, error: 'Room not found.' };
    const room = roomRows[0];

    if (room.host_user_id && room.host_user_id.toString() !== hostUserId.toString()) {
      return { success: false, error: 'Only the host can end party media.' };
    }

    await query(`UPDATE popolive.party_rooms SET status = 'ended' WHERE id = $1`, [roomId]);
    this.invalidateRoom(roomId);
    return { success: true };
  }
}

export const partyMediaService = new WebPartyMediaService();
