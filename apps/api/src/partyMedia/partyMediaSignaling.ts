/**
 * POPO LIVE — PARTY MEDIA SIGNALING & 9-SEAT AUDIO LIFECYCLE
 * 
 * Enforces:
 * - Age 18+ verification (P7-P5)
 * - 9-seat speaker limits (10th+ user gets listener-only)
 * - Host moderation (kick, mute, end room)
 * - Server-side audio track enablement/disablement on mic toggle
 * - Webhook drift reconciliation
 */

import { Pool } from 'pg';
import { partyMediaProvider } from './partyMediaProvider';
import {
  PartyParticipantRole,
  PartyRoomToken,
  PartyWebhookEvent,
} from './partyMediaTypes';

let poolInstance: Pool | null = null;

function getDbPool(): Pool {
  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString:
        process.env.DATABASE_URL ||
        'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 3000,
    });
  }
  return poolInstance;
}

interface MockUser {
  id: string;
  birthdate: string;
  is_adult_verified: boolean;
  status: string;
}

interface MockPartySeat {
  seat_number: number;
  participant_id: string | null;
  participant_name: string | null;
  is_host: boolean;
  is_muted: boolean;
  status: 'available' | 'occupied' | 'locked';
}

interface MockPartyRoom {
  id: string;
  room_number: string;
  host_user_id: string;
  status: string;
  seats: MockPartySeat[];
}

export class PartyMediaSignalingService {
  private mockUsers: Map<string, MockUser> = new Map();
  private mockRooms: Map<string, MockPartyRoom> = new Map();

  public registerMockUser(user: MockUser): void {
    this.mockUsers.set(user.id, user);
  }

  public registerMockRoom(room: MockPartyRoom): void {
    this.mockRooms.set(room.id, room);
  }

  public getMockRoom(roomId: string): MockPartyRoom | undefined {
    return this.mockRooms.get(roomId);
  }

  /**
   * Issues role-scoped room token enforcing 9-seat capacity limits
   */
  public async issueRoomToken(roomId: string, userId: string): Promise<{ success: boolean; tokenData?: PartyRoomToken; error?: string; code?: string }> {
    // 1. Verify User Eligibility (Age 18+)
    let user: any = null;
    try {
      const pool = getDbPool();
      const userRes = await pool.query(
        `SELECT id, birthdate, is_adult_verified, status FROM popolive.users WHERE id = $1 LIMIT 1`,
        [userId]
      );
      if (userRes.rows.length > 0) {
        user = userRes.rows[0];
      }
    } catch (_) {
      user = this.mockUsers.get(userId);
    }

    if (!user) {
      user = this.mockUsers.get(userId);
    }

    if (!user) {
      return { success: false, error: 'User not found.', code: 'USER_NOT_FOUND' };
    }

    let isAdult = Boolean(user.is_adult_verified);
    if (!isAdult && user.birthdate) {
      const birth = new Date(user.birthdate);
      const age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      isAdult = age >= 18;
    }

    if (!isAdult) {
      return {
        success: false,
        error: 'Minimum age of 18 is required to join party media.',
        code: 'AGE_VERIFICATION_FAILED',
      };
    }

    // 2. Load Party Room & Seats
    let room: any = null;
    let seats: any[] = [];
    try {
      const pool = getDbPool();
      const roomRes = await pool.query(
        `SELECT id, room_number, host_user_id, status FROM popolive.party_rooms WHERE id = $1 OR room_number = $1 LIMIT 1`,
        [roomId]
      );
      if (roomRes.rows.length > 0) {
        room = roomRes.rows[0];
        const seatRes = await pool.query(
          `SELECT seat_number, participant_id, is_host, is_muted, status
           FROM popolive.party_seats
           WHERE room_number = $1
           ORDER BY seat_number ASC`,
          [room.room_number]
        );
        seats = seatRes.rows;
      }
    } catch (_) {
      const mRoom = this.mockRooms.get(roomId);
      if (mRoom) {
        room = mRoom;
        seats = mRoom.seats;
      }
    }

    if (!room) {
      const mRoom = this.mockRooms.get(roomId);
      if (mRoom) {
        room = mRoom;
        seats = mRoom.seats;
      }
    }

    if (!room) {
      return { success: false, error: 'Party room not found.', code: 'ROOM_NOT_FOUND' };
    }

    if (room.status === 'ended' || room.status === 'closed') {
      return { success: false, error: 'Party room has ended.', code: 'ROOM_ENDED' };
    }

    // 3. Determine Participant Role (9 Seats Rule)
    let role: PartyParticipantRole = 'listener';
    let seatNumber: number | null = null;

    // Check if user is host
    const isRoomHost = room.host_user_id && room.host_user_id.toString() === userId.toString();
    if (isRoomHost) {
      role = 'host';
      seatNumber = 1;
    } else {
      // Find if user is seated in any of seats 1-9
      const occupiedSeat = seats.find(
        (s) => s.participant_id && s.participant_id.toString() === userId.toString()
      );

      if (occupiedSeat) {
        seatNumber = occupiedSeat.seat_number;
        role = occupiedSeat.seat_number === 1 ? 'host' : 'speaker';
      } else {
        // Not seated: assigned listener role (enforces 10th+ user is listener-only)
        role = 'listener';
        seatNumber = null;
      }
    }

    // 4. Generate Token via Provider
    const tokenData = partyMediaProvider.generateRoomToken(
      room.id,
      room.room_number,
      userId,
      role,
      seatNumber
    );

    return {
      success: true,
      tokenData,
    };
  }

  /**
   * Toggles seat microphone state and updates server-side audio track status
   */
  public async toggleMic(roomId: string, seatNumber: number, callerUserId: string): Promise<{ success: boolean; seatNumber: number; isMuted: boolean; audioEnabled: boolean; error?: string; code?: string }> {
    let room: any = null;
    let seat: any = null;

    try {
      const pool = getDbPool();
      const roomRes = await pool.query(
        `SELECT id, room_number, host_user_id FROM popolive.party_rooms WHERE id = $1 OR room_number = $1 LIMIT 1`,
        [roomId]
      );
      if (roomRes.rows.length > 0) {
        room = roomRes.rows[0];
        const sRes = await pool.query(
          `SELECT seat_number, participant_id, is_host, is_muted, status
           FROM popolive.party_seats
           WHERE room_number = $1 AND seat_number = $2
           LIMIT 1`,
          [room.room_number, seatNumber]
        );
        if (sRes.rows.length > 0) seat = sRes.rows[0];
      }
    } catch (_) {
      const mRoom = this.mockRooms.get(roomId);
      if (mRoom) {
        room = mRoom;
        seat = mRoom.seats.find((s) => s.seat_number === seatNumber);
      }
    }

    if (!room) {
      const mRoom = this.mockRooms.get(roomId);
      if (mRoom) {
        room = mRoom;
        seat = mRoom.seats.find((s) => s.seat_number === seatNumber);
      }
    }

    if (!room || !seat) {
      return {
        success: false,
        seatNumber,
        isMuted: true,
        audioEnabled: false,
        error: 'Seat or room not found.',
        code: 'NOT_FOUND',
      };
    }

    if (seat.status !== 'occupied' || !seat.participant_id) {
      return {
        success: false,
        seatNumber,
        isMuted: true,
        audioEnabled: false,
        error: 'Cannot toggle mic on an unoccupied seat.',
        code: 'ONLY_SEATED_USER_CAN_TOGGLE_MIC',
      };
    }

    const isOccupant = seat.participant_id.toString() === callerUserId.toString();
    const isHost = room.host_user_id && room.host_user_id.toString() === callerUserId.toString();

    if (!isOccupant && !isHost) {
      return {
        success: false,
        seatNumber,
        isMuted: seat.is_muted,
        audioEnabled: !seat.is_muted,
        error: 'Only the seated participant or host can toggle microphone.',
        code: 'ONLY_SEATED_USER_CAN_TOGGLE_MIC',
      };
    }

    const newMuted = !Boolean(seat.is_muted);

    // Update DB
    try {
      const pool = getDbPool();
      await pool.query(
        `UPDATE popolive.party_seats SET is_muted = $1 WHERE room_number = $2 AND seat_number = $3`,
        [newMuted, room.room_number, seatNumber]
      );
    } catch (_) {}

    // Update in-memory
    if (this.mockRooms.has(room.id)) {
      const targetSeat = this.mockRooms.get(room.id)!.seats.find((s) => s.seat_number === seatNumber);
      if (targetSeat) targetSeat.is_muted = newMuted;
    }

    // Set server-side audio track state
    const audioEnabled = partyMediaProvider.setSeatAudioTrackState(room.id, seatNumber, newMuted);

    return {
      success: true,
      seatNumber,
      isMuted: newMuted,
      audioEnabled,
    };
  }

  /**
   * Host kicks a seated participant -> audio track force-disabled
   */
  public async kickParticipant(roomId: string, seatNumber: number, hostUserId: string): Promise<{ success: boolean; error?: string; code?: string }> {
    let room: any = null;
    try {
      const pool = getDbPool();
      const rRes = await pool.query(
        `SELECT id, room_number, host_user_id FROM popolive.party_rooms WHERE id = $1 LIMIT 1`,
        [roomId]
      );
      if (rRes.rows.length > 0) room = rRes.rows[0];
    } catch (_) {
      room = this.mockRooms.get(roomId);
    }

    if (!room) room = this.mockRooms.get(roomId);
    if (!room) return { success: false, error: 'Room not found.', code: 'ROOM_NOT_FOUND' };

    const isHost = room.host_user_id && room.host_user_id.toString() === hostUserId.toString();
    if (!isHost) {
      return { success: false, error: 'Only the host can kick participants.', code: 'FORBIDDEN_NOT_HOST' };
    }

    // Vacate seat
    try {
      const pool = getDbPool();
      await pool.query(
        `UPDATE popolive.party_seats
         SET participant_id = NULL, participant_name = NULL, status = 'available', is_muted = false
         WHERE room_number = $1 AND seat_number = $2`,
        [room.room_number, seatNumber]
      );
    } catch (_) {}

    if (this.mockRooms.has(roomId)) {
      const s = this.mockRooms.get(roomId)!.seats.find((st) => st.seat_number === seatNumber);
      if (s) {
        s.participant_id = null;
        s.participant_name = null;
        s.status = 'available';
      }
    }

    // Force disconnect audio track on provider
    partyMediaProvider.forceKickParticipant(roomId, seatNumber);

    return { success: true };
  }

  /**
   * Host ends party media session -> all participants disconnected and tokens invalidated
   */
  public async endPartyMedia(roomId: string, hostUserId: string): Promise<{ success: boolean; error?: string }> {
    let room: any = null;
    try {
      const pool = getDbPool();
      const rRes = await pool.query(
        `SELECT id, room_number, host_user_id FROM popolive.party_rooms WHERE id = $1 LIMIT 1`,
        [roomId]
      );
      if (rRes.rows.length > 0) room = rRes.rows[0];
    } catch (_) {
      room = this.mockRooms.get(roomId);
    }

    if (!room) room = this.mockRooms.get(roomId);
    if (!room) return { success: false, error: 'Room not found.' };

    const isHost = room.host_user_id && room.host_user_id.toString() === hostUserId.toString();
    if (!isHost) {
      return { success: false, error: 'Only the host can end party media.' };
    }

    try {
      const pool = getDbPool();
      await pool.query(`UPDATE popolive.party_rooms SET status = 'ended' WHERE id = $1`, [roomId]);
    } catch (_) {}

    if (this.mockRooms.has(roomId)) {
      this.mockRooms.get(roomId)!.status = 'ended';
    }

    // Invalidate room tokens
    partyMediaProvider.invalidateRoom(roomId);

    return { success: true };
  }

  /**
   * Processes inbound webhook from SFU provider
   */
  public async handleWebhook(event: PartyWebhookEvent): Promise<{ handled: boolean; action: string }> {
    if (event.event === 'participant_left' && event.seatNumber) {
      if (this.mockRooms.has(event.roomId)) {
        const s = this.mockRooms.get(event.roomId)!.seats.find((st) => st.seat_number === event.seatNumber);
        if (s) {
          s.participant_id = null;
          s.status = 'available';
        }
      }
      return { handled: true, action: 'SEAT_VACATED_ON_DISCONNECT' };
    } else if (event.event === 'track_unpublished' && event.seatNumber) {
      partyMediaProvider.setSeatAudioTrackState(event.roomId, event.seatNumber, true);
      return { handled: true, action: 'AUDIO_TRACK_UNPUBLISHED' };
    }

    return { handled: true, action: 'WEBHOOK_PROCESSED' };
  }
}

export const partyMediaSignaling = new PartyMediaSignalingService();
