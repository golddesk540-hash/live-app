import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { resolvePartyRoom } from '@/lib/partyApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/party/rooms/:id/seats
 * Retrieves all 9 seats for a party room
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const room = await resolvePartyRoom(params.roomId);
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Party room not found.', code: 'ROOM_NOT_FOUND' },
        { status: 404 }
      );
    }

    const rows = await query<any>(
      `SELECT 
        id,
        seat_number,
        participant_id,
        participant_name,
        participant_avatar,
        is_host,
        is_muted,
        is_camera_on,
        status,
        occupied_at,
        updated_at
       FROM popolive.party_seats
       WHERE room_number = $1
       ORDER BY seat_number ASC`,
      [room.room_number]
    );

    const seats = rows.map((s) => ({
      id: s.id,
      seatNumber: s.seat_number,
      participantId: s.participant_id,
      participantName: s.participant_name,
      participantAvatar: s.participant_avatar,
      isHost: Boolean(s.is_host),
      isMuted: Boolean(s.is_muted),
      isCameraOn: Boolean(s.is_camera_on),
      status: s.status,
      occupiedAt: s.occupied_at,
      updatedAt: s.updated_at,
    }));

    const occupiedCount = seats.filter((s) => s.status === 'occupied').length;

    return NextResponse.json({
      success: true,
      roomNumber: room.room_number,
      seats,
      totalSeats: seats.length,
      occupiedCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
