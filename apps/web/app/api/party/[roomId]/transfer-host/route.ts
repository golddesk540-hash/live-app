import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;
    const body = await req.json().catch(() => ({}));
    const authUser = await getAuthenticatedUser(req).catch(() => null);
    const isDemo = req.nextUrl.searchParams.get('preview') === 'demo' || body.preview === 'demo';

    const targetSeatNumber = Number(body.targetSeatNumber);
    const isHostAction = body.isHostAction !== false;

    if (!isHostAction && !isDemo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. Only the host can transfer room ownership.',
        },
        { status: 403 }
      );
    }

    if (
      isNaN(targetSeatNumber) ||
      targetSeatNumber < 2 ||
      targetSeatNumber > 9
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid target seat number. Must be a seated participant between seats 2 and 9.',
        },
        { status: 400 }
      );
    }

    // Retrieve target seat
    const targetRows = await query(
      `SELECT participant_id, participant_name, participant_avatar, status, is_muted, is_camera_on
       FROM popolive.party_seats
       WHERE room_number = $1 AND seat_number = $2`,
      [roomId, targetSeatNumber]
    );

    if (!targetRows || targetRows.length === 0 || targetRows[0].status !== 'occupied') {
      return NextResponse.json(
        {
          success: false,
          error: `Seat ${targetSeatNumber} is empty. You can only transfer host privileges to an active seated participant.`,
        },
        { status: 400 }
      );
    }

    const newHost = targetRows[0];

    // Retrieve current host in Seat 1
    const hostRows = await query(
      `SELECT participant_id, participant_name, participant_avatar, is_muted, is_camera_on
       FROM popolive.party_seats
       WHERE room_number = $1 AND seat_number = 1`,
      [roomId]
    );
    const oldHost = hostRows && hostRows[0] ? hostRows[0] : null;

    await withTransaction(async (client) => {
      // 1. Swap old host into target seat as participant
      if (oldHost) {
        await client.query(
          `UPDATE popolive.party_seats
           SET participant_id = $2,
               participant_name = $3,
               participant_avatar = $4,
               is_host = false,
               is_muted = $5,
               is_camera_on = $6,
               updated_at = NOW()
           WHERE room_number = $1 AND seat_number = $7`,
          [
            roomId,
            oldHost.participant_id,
            oldHost.participant_name,
            oldHost.participant_avatar,
            oldHost.is_muted,
            oldHost.is_camera_on,
            targetSeatNumber,
          ]
        );
      }

      // 2. Put new host in Seat 1
      await client.query(
        `UPDATE popolive.party_seats
         SET participant_id = $2,
             participant_name = $3,
             participant_avatar = $4,
             is_host = true,
             is_muted = $5,
             is_camera_on = $6,
             status = 'occupied',
             updated_at = NOW()
         WHERE room_number = $1 AND seat_number = 1`,
        [
          roomId,
          newHost.participant_id,
          newHost.participant_name,
          newHost.participant_avatar,
          newHost.is_muted,
          newHost.is_camera_on,
        ]
      );

      // 3. Update room host_nickname
      await client.query(
        `UPDATE popolive.party_rooms
         SET host_nickname = $2,
             host_avatar = $3,
             updated_at = NOW()
         WHERE room_number = $1`,
        [roomId, newHost.participant_name, newHost.participant_avatar]
      );
    });

    // Retrieve all 9 seats
    const allSeats = await query(
      `SELECT id, room_number, seat_number, participant_id, participant_name, participant_avatar,
              is_host, is_muted, is_camera_on, status, occupied_at, updated_at
       FROM popolive.party_seats
       WHERE room_number = $1
       ORDER BY seat_number ASC`,
      [roomId]
    );

    return NextResponse.json({
      success: true,
      message: `Host role successfully transferred to ${newHost.participant_name}!`,
      newHostName: newHost.participant_name,
      newHostId: newHost.participant_id,
      seats: allSeats,
    });
  } catch (error: any) {
    console.error('API /party/[roomId]/transfer-host error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while transferring host' },
      { status: 500 }
    );
  }
}
