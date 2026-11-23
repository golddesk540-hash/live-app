import { NextRequest, NextResponse } from 'next/server';
import { withTransaction } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { resolvePartyRoom } from '@/lib/partyApiService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/party/rooms/:id/requests/:rid/accept
 * Host only: accept a seat join request atomically
 * Enforces:
 * - Rule 5: Only host accepts requests (rejects with HTTP 403 ONLY_HOST_CAN_MANAGE_REQUESTS)
 * - Rule 3: Seat assignment atomic — no two users same seat (concurrency safe with SELECT FOR UPDATE)
 * - Rule 4: One seat per user (rejects if candidate already seated with HTTP 409 USER_ALREADY_SEATED)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string; requestId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const room = await resolvePartyRoom(params.roomId);
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Party room not found.', code: 'ROOM_NOT_FOUND' },
        { status: 404 }
      );
    }

    // 1. Locked Rule 5: Host verification
    const isHost =
      (room.host_user_id && room.host_user_id.toString() === user.id.toString()) ||
      room.host_nickname === user.nickname;

    if (!isHost) {
      return NextResponse.json(
        {
          success: false,
          error: 'ONLY_HOST_CAN_MANAGE_REQUESTS: Only the room host can accept seat requests.',
          code: 'ONLY_HOST_CAN_MANAGE_REQUESTS',
        },
        { status: 403 }
      );
    }

    // 2. Atomic seat assignment in PostgreSQL transaction
    const assignment = await withTransaction(async (client) => {
      // Lock request row
      const reqRes = await client.query(
        `SELECT * FROM popolive.party_seat_requests WHERE id = $1 FOR UPDATE`,
        [params.requestId]
      );

      if (reqRes.rows.length === 0) {
        throw { status: 404, message: 'Request not found.', code: 'REQUEST_NOT_FOUND' };
      }

      const requestRow = reqRes.rows[0];

      if (requestRow.status !== 'pending') {
        throw {
          status: 409,
          message: `Request is already ${requestRow.status}.`,
          code: 'REQUEST_ALREADY_RESOLVED',
        };
      }

      const candidateUserId = requestRow.user_id;

      // 3. Guest cannot approve their own request
      if (candidateUserId && candidateUserId.toString() === user.id.toString()) {
        throw {
          status: 403,
          message: 'CANNOT_APPROVE_OWN_REQUEST: A guest cannot approve their own seat request.',
          code: 'CANNOT_APPROVE_OWN_REQUEST',
        };
      }

      // 4. Locked Rule 4: One seat per user in this room
      const seatedRes = await client.query(
        `SELECT seat_number FROM popolive.party_seats
         WHERE room_number = $1 AND participant_id = $2 AND status = 'occupied'`,
        [room.room_number, candidateUserId]
      );

      if (seatedRes.rows.length > 0) {
        // Mark request as resolved
        await client.query(
          `UPDATE popolive.party_seat_requests SET status = 'cancelled', responded_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [params.requestId]
        );
        throw {
          status: 409,
          message: `USER_ALREADY_SEATED: Candidate is already seated in Seat #${seatedRes.rows[0].seat_number}.`,
          code: 'USER_ALREADY_SEATED',
        };
      }

      // 5. Verify requested seat remains available & lock it with SELECT FOR UPDATE
      let targetSeat = requestRow.seat_number;

      if (targetSeat !== null && targetSeat !== undefined) {
        const targetSeatRes = await client.query(
          `SELECT * FROM popolive.party_seats 
           WHERE room_number = $1 AND seat_number = $2 AND status = 'available' AND participant_id IS NULL 
           FOR UPDATE`,
          [room.room_number, targetSeat]
        );

        if (targetSeatRes.rows.length === 0) {
          throw {
            status: 409,
            message: `SEAT_ALREADY_OCCUPIED: Requested Seat #${targetSeat} is no longer available.`,
            code: 'SEAT_ALREADY_OCCUPIED',
          };
        }
      } else {
        const fallbackSeatRes = await client.query(
          `SELECT seat_number FROM popolive.party_seats
           WHERE room_number = $1 AND seat_number BETWEEN 2 AND 9 AND status = 'available' AND participant_id IS NULL
           ORDER BY seat_number ASC
           LIMIT 1
           FOR UPDATE`,
          [room.room_number]
        );

        if (fallbackSeatRes.rows.length === 0) {
          throw {
            status: 409,
            message: 'ROOM_FULL_OR_SEAT_ALREADY_OCCUPIED: No available seats left in this party room.',
            code: 'ROOM_FULL_OR_SEAT_ALREADY_OCCUPIED',
          };
        }

        targetSeat = fallbackSeatRes.rows[0].seat_number;
      }

      // 6. Occupy seat in PostgreSQL
      const updateSeatRes = await client.query(
        `UPDATE popolive.party_seats
         SET participant_id = $1,
             participant_name = $2,
             participant_avatar = $3,
             status = 'occupied',
             occupied_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE room_number = $4 AND seat_number = $5
         RETURNING id, room_number, seat_number, participant_id, participant_name, participant_avatar, is_host, is_muted, status, occupied_at, updated_at`,
        [
          candidateUserId,
          requestRow.user_name,
          requestRow.user_avatar || '/avatars/default.png',
          room.room_number,
          targetSeat,
        ]
      );

      const updatedSeat = updateSeatRes.rows[0];

      // 7. Mark request accepted
      await client.query(
        `UPDATE popolive.party_seat_requests
         SET status = 'accepted', responded_at = CURRENT_TIMESTAMP, seat_number = $1
         WHERE id = $2`,
        [targetSeat, params.requestId]
      );

      // 8. Update current_members in party_rooms
      await client.query(
        `UPDATE popolive.party_rooms
         SET current_members = (SELECT COUNT(*) FROM popolive.party_seats WHERE room_number = $1 AND status = 'occupied'),
             updated_at = CURRENT_TIMESTAMP
         WHERE room_number = $1`,
        [room.room_number]
      );

      return {
        assignedSeat: targetSeat,
        participantId: candidateUserId,
        participantName: requestRow.user_name,
        seat: updatedSeat,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Request accepted. User assigned to Seat #${assignment.assignedSeat}.`,
      assignedSeat: assignment.assignedSeat,
      participantId: assignment.participantId,
      participantName: assignment.participantName,
      status: 'accepted',
      seat: {
        id: assignment.seat.id,
        roomNumber: assignment.seat.room_number,
        seatNumber: assignment.seat.seat_number,
        participantId: assignment.seat.participant_id,
        participantName: assignment.seat.participant_name,
        participantAvatar: assignment.seat.participant_avatar,
        isHost: assignment.seat.is_host,
        isMuted: assignment.seat.is_muted,
        status: assignment.seat.status,
        occupiedAt: assignment.seat.occupied_at,
        updatedAt: assignment.seat.updated_at,
      },
      assignment: {
        seatNumber: assignment.assignedSeat,
        participantId: assignment.participantId,
        participantName: assignment.participantName,
      },
    });
  } catch (error: any) {
    const status = error.status || 500;
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to accept seat request.',
        code: error.code || 'INTERNAL_ERROR',
      },
      { status }
    );
  }
}
