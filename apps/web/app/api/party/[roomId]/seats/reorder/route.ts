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

    const fromSeat = Number(body.fromSeat);
    const toSeat = Number(body.toSeat);
    const reorderedBy = authUser?.nickname || body.reorderedBy || 'Maria Live';
    const isHostAction = body.isHostAction !== false; // default true for host tools

    // Validation: Host Seat 1 is protected
    if (fromSeat === 1 || toSeat === 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Seat 1 is protected for the Host. Host cannot be moved or displaced in seat reordering.',
        },
        { status: 403 }
      );
    }

    // Validation: Seat Range (2 to 9)
    if (
      isNaN(fromSeat) ||
      isNaN(toSeat) ||
      fromSeat < 2 ||
      fromSeat > 9 ||
      toSeat < 2 ||
      toSeat > 9
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid seat numbers. Participant seats must be between 2 and 9.',
        },
        { status: 400 }
      );
    }

    // Validation: Same seat
    if (fromSeat === toSeat) {
      return NextResponse.json(
        {
          success: false,
          error: 'Source and destination seat cannot be identical.',
        },
        { status: 400 }
      );
    }

    // Authorization check
    if (!isHostAction && !isDemo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. Only the party host can reorder participant seats.',
        },
        { status: 403 }
      );
    }

    // Fetch existing seats from database
    const seatRows = await query(
      `SELECT id, room_number, seat_number, participant_id, participant_name, participant_avatar,
              is_host, is_muted, is_camera_on, status, occupied_at
       FROM popolive.party_seats
       WHERE room_number = $1 AND seat_number IN ($2, $3)`,
      [roomId, fromSeat, toSeat]
    );

    const fromRow = seatRows.find((r: any) => r.seat_number === fromSeat);
    const toRow = seatRows.find((r: any) => r.seat_number === toSeat);

    if (!fromRow || fromRow.status !== 'occupied' || !fromRow.participant_id) {
      return NextResponse.json(
        {
          success: false,
          error: `Seat ${fromSeat} is empty. Only occupied seats can be moved or swapped.`,
        },
        { status: 400 }
      );
    }

    let actionType: 'swap' | 'move' = 'move';

    if (toRow && toRow.status === 'occupied' && toRow.participant_id) {
      // SWAP: Both seats are occupied
      actionType = 'swap';

      await withTransaction(async (client) => {
        // Step A: Set fromSeat row to toRow participant data
        await client.query(
          `UPDATE popolive.party_seats
           SET participant_id = $3,
               participant_name = $4,
               participant_avatar = $5,
               is_muted = $6,
               is_camera_on = $7,
               status = 'occupied',
               occupied_at = $8,
               updated_at = NOW()
           WHERE room_number = $1 AND seat_number = $2`,
          [
            roomId,
            fromSeat,
            toRow.participant_id,
            toRow.participant_name,
            toRow.participant_avatar,
            toRow.is_muted,
            toRow.is_camera_on,
            toRow.occupied_at || new Date().toISOString(),
          ]
        );

        // Step B: Set toSeat row to fromRow participant data
        await client.query(
          `UPDATE popolive.party_seats
           SET participant_id = $3,
               participant_name = $4,
               participant_avatar = $5,
               is_muted = $6,
               is_camera_on = $7,
               status = 'occupied',
               occupied_at = $8,
               updated_at = NOW()
           WHERE room_number = $1 AND seat_number = $2`,
          [
            roomId,
            toSeat,
            fromRow.participant_id,
            fromRow.participant_name,
            fromRow.participant_avatar,
            fromRow.is_muted,
            fromRow.is_camera_on,
            fromRow.occupied_at || new Date().toISOString(),
          ]
        );

        // Step C: Insert audit log
        await client.query(
          `INSERT INTO popolive.party_seat_reorder_logs (
             room_number, reordered_by, from_seat, to_seat, participant_id, action_type
           ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [roomId, reorderedBy, fromSeat, toSeat, fromRow.participant_id, 'swap']
        );
      });
    } else {
      // MOVE: Destination seat is empty
      actionType = 'move';

      await withTransaction(async (client) => {
        // Step A: Put fromRow participant data into toSeat
        await client.query(
          `INSERT INTO popolive.party_seats (
             room_number, seat_number, participant_id, participant_name, participant_avatar,
             is_host, is_muted, is_camera_on, status, occupied_at, updated_at
           ) VALUES ($1, $2, $3, $4, $5, false, $6, $7, 'occupied', $8, NOW())
           ON CONFLICT (room_number, seat_number) DO UPDATE SET
             participant_id = EXCLUDED.participant_id,
             participant_name = EXCLUDED.participant_name,
             participant_avatar = EXCLUDED.participant_avatar,
             is_muted = EXCLUDED.is_muted,
             is_camera_on = EXCLUDED.is_camera_on,
             status = 'occupied',
             occupied_at = EXCLUDED.occupied_at,
             updated_at = NOW()`,
          [
            roomId,
            toSeat,
            fromRow.participant_id,
            fromRow.participant_name,
            fromRow.participant_avatar,
            fromRow.is_muted,
            fromRow.is_camera_on,
            fromRow.occupied_at || new Date().toISOString(),
          ]
        );

        // Step B: Clear fromSeat to available
        await client.query(
          `UPDATE popolive.party_seats
           SET participant_id = NULL,
               participant_name = NULL,
               participant_avatar = NULL,
               is_muted = false,
               is_camera_on = false,
               status = 'available',
               occupied_at = NULL,
               updated_at = NOW()
           WHERE room_number = $1 AND seat_number = $2`,
          [roomId, fromSeat]
        );

        // Step C: Insert audit log
        await client.query(
          `INSERT INTO popolive.party_seat_reorder_logs (
             room_number, reordered_by, from_seat, to_seat, participant_id, action_type
           ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [roomId, reorderedBy, fromSeat, toSeat, fromRow.participant_id, 'move']
        );
      });
    }

    // Retrieve all updated 9 seats
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
      message:
        actionType === 'swap'
          ? `Successfully swapped Seat ${fromSeat} and Seat ${toSeat}!`
          : `Successfully moved participant from Seat ${fromSeat} to Seat ${toSeat}!`,
      actionType,
      fromSeat,
      toSeat,
      participantId: fromRow.participant_id,
      participantName: fromRow.participant_name,
      seats: allSeats,
    });
  } catch (error: any) {
    console.error('API /party/[roomId]/seats/reorder error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while reordering seats' },
      { status: 500 }
    );
  }
}
