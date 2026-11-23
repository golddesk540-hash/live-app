import { query, withTransaction } from '@/lib/db';
import { AuthUser, calculateAge } from '@/lib/auth';

/**
 * POPO LIVE — PHASE 7 (P7-P5)
 * PARTY MODULE API SERVICE & LOCKED RULES ENGINE
 */

export const USE_PARTY_API: boolean = process.env.NEXT_PUBLIC_USE_PARTY_API === 'true';

export interface PartySeatInfo {
  seatNumber: number;
  participantId: string | null;
  participantName: string | null;
  participantAvatar: string | null;
  isHost: boolean;
  isMuted: boolean;
  isCameraOn: boolean;
  status: 'available' | 'occupied' | 'locked';
  occupiedAt: string | null;
}

export interface PartyRoomDetail {
  id: string;
  roomNumber: string;
  title: string;
  collageUrl: string;
  currentMembers: number;
  maxMembers: number;
  maxSeats: number;
  isLive: boolean;
  status: string;
  category: string;
  categoryId: string;
  country: string;
  countryCode: string;
  flagEmoji: string;
  hostNickname: string;
  hostAvatar: string;
  hostUserId: string | null;
  seatFaces: string[];
  seatCountFormatted: string;
  viewerCount: number;
  createdAt: string;
}

/**
 * Resolves a room by UUID id or string room_number
 */
export async function resolvePartyRoom(identifier: string) {
  const rows = await query<any>(
    `SELECT * FROM popolive.party_rooms 
     WHERE id::text = $1 OR room_number = $1 
     LIMIT 1`,
    [identifier]
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Enforces Age 18+ Locked Rule
 */
export function assertAdult(user: AuthUser, actionName: string = 'participate in Party') {
  if (user.is_adult_verified) return;
  const age = calculateAge(user.birthdate || '');
  if (age < 18) {
    const error: any = new Error(`AGE_VERIFICATION_FAILED: You must be at least 18 years old to ${actionName}. Current age: ${age}`);
    error.code = 'AGE_VERIFICATION_FAILED';
    error.status = 403;
    throw error;
  }
}

/**
 * Initializes exactly 9 seats for a newly created party room
 */
export async function initializePartySeats(
  clientQuery: (sql: string, params?: any[]) => Promise<any>,
  partyId: string,
  roomNumber: string,
  hostUser: AuthUser
) {
  // Seat 1 is occupied by the host
  await clientQuery(
    `INSERT INTO popolive.party_seats (
      id, party_id, room_number, seat_number, participant_id, participant_name,
      participant_avatar, is_host, is_muted, is_camera_on, status, occupied_at, updated_at
    ) VALUES (
      gen_random_uuid(), $1, $2, 1, $3, $4, $5, true, false, false, 'occupied', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ) ON CONFLICT (room_number, seat_number) DO UPDATE
      SET participant_id = $3, participant_name = $4, participant_avatar = $5,
          is_host = true, status = 'occupied', updated_at = CURRENT_TIMESTAMP`,
    [partyId, roomNumber, hostUser.id, hostUser.nickname, hostUser.avatar_url || '/avatars/default.png']
  );

  // Seats 2 through 9 are available
  for (let s = 2; s <= 9; s++) {
    await clientQuery(
      `INSERT INTO popolive.party_seats (
        id, party_id, room_number, seat_number, participant_id, participant_name,
        participant_avatar, is_host, is_muted, is_camera_on, status, occupied_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, NULL, NULL, NULL, false, false, false, 'available', NULL, CURRENT_TIMESTAMP
      ) ON CONFLICT (room_number, seat_number) DO NOTHING`,
      [partyId, roomNumber, s]
    );
  }
}
