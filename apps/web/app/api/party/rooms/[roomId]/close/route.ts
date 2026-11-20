import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { resolvePartyRoom } from '@/lib/partyApiService';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
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

    // Host check
    if (room.host_user_id && room.host_user_id.toString() !== user.id.toString()) {
      return NextResponse.json(
        { success: false, error: 'Only the party host can close the room.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    await withTransaction(async (client) => {
      // Mark room closed
      await client.query(
        `UPDATE popolive.party_rooms
         SET status = 'closed', is_live = false, current_members = 0,
             closed_at = CURRENT_TIMESTAMP, closed_by = $1, closing_reason = 'Host closed party',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [user.id, room.id]
      );

      // Vacate non-host seats
      await client.query(
        `UPDATE popolive.party_seats
         SET participant_id = NULL, participant_name = NULL, participant_avatar = NULL,
             status = 'available', is_muted = false, occupied_at = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE room_number = $1`,
        [room.room_number]
      );
    });

    return NextResponse.json({
      success: true,
      message: 'Party room closed and all seats vacated.',
      status: 'closed',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
