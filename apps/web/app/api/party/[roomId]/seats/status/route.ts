import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;

    const rows = await query(
      `SELECT seat_number, participant_id, participant_name, participant_avatar,
              is_host, is_muted, is_camera_on, is_host_muted, is_video_disabled,
              camera_facing, status, occupied_at, updated_at
       FROM popolive.party_seats
       WHERE room_number = $1
       ORDER BY seat_number ASC`,
      [roomId]
    );

    return NextResponse.json({
      success: true,
      roomNumber: roomId,
      timestamp: Date.now(),
      seats: rows || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve seat status' },
      { status: 500 }
    );
  }
}
