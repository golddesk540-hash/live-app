import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ToggleSeatMediaDto } from '@/lib/party';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;
    const body: ToggleSeatMediaDto = await req.json();

    const { seatNumber, type, enabled, facing, participantId } = body;

    if (!seatNumber || seatNumber < 1 || seatNumber > 9) {
      return NextResponse.json(
        { success: false, error: 'Invalid seat number. Must be between 1 and 9.' },
        { status: 400 }
      );
    }

    if (!type || !['mic', 'camera', 'facing'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid toggle type. Must be mic, camera, or facing.' },
        { status: 400 }
      );
    }

    // 1. Fetch current seat record
    const existingSeats = await query(
      `SELECT * FROM popolive.party_seats WHERE room_number = $1 AND seat_number = $2 LIMIT 1`,
      [roomId, seatNumber]
    );

    if (!existingSeats || existingSeats.length === 0) {
      return NextResponse.json(
        { success: false, error: `Seat #${seatNumber} not found in Room ${roomId}.` },
        { status: 404 }
      );
    }

    const currentSeat = existingSeats[0];
    if (currentSeat.status !== 'occupied') {
      return NextResponse.json(
        { success: false, error: `Seat #${seatNumber} is not occupied.` },
        { status: 400 }
      );
    }

    // 2. Perform requested update
    let updatedRow: any = null;
    let message = '';

    if (type === 'mic') {
      const isMuted = !Boolean(enabled);
      const res = await query(
        `UPDATE popolive.party_seats
         SET is_muted = $1, is_host_muted = false, updated_at = NOW()
         WHERE room_number = $2 AND seat_number = $3
         RETURNING *`,
        [isMuted, roomId, seatNumber]
      );
      updatedRow = res[0];
      message = isMuted ? `Microphone muted on Seat #${seatNumber}` : `Microphone unmuted on Seat #${seatNumber}`;
    } else if (type === 'camera') {
      const isCameraOn = Boolean(enabled);
      const res = await query(
        `UPDATE popolive.party_seats
         SET is_camera_on = $1, is_video_disabled = false, updated_at = NOW()
         WHERE room_number = $2 AND seat_number = $3
         RETURNING *`,
        [isCameraOn, roomId, seatNumber]
      );
      updatedRow = res[0];
      message = isCameraOn ? `Camera enabled on Seat #${seatNumber}` : `Camera disabled on Seat #${seatNumber}`;
    } else if (type === 'facing') {
      const cameraFacing = facing === 'environment' ? 'environment' : 'user';
      const res = await query(
        `UPDATE popolive.party_seats
         SET camera_facing = $1, updated_at = NOW()
         WHERE room_number = $2 AND seat_number = $3
         RETURNING *`,
        [cameraFacing, roomId, seatNumber]
      );
      updatedRow = res[0];
      message = `Camera switched to ${cameraFacing} facing on Seat #${seatNumber}`;
    }

    return NextResponse.json({
      success: true,
      message,
      seat: {
        seatNumber: updatedRow.seat_number,
        participantId: updatedRow.participant_id,
        participantName: updatedRow.participant_name,
        isMuted: updatedRow.is_muted,
        isCameraOn: updatedRow.is_camera_on,
        isHostMuted: updatedRow.is_host_muted,
        isVideoDisabled: updatedRow.is_video_disabled,
        cameraFacing: updatedRow.camera_facing,
        status: updatedRow.status,
      },
    });
  } catch (error: any) {
    console.error('API /party/[roomId]/seats/media/toggle error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to toggle seat media' },
      { status: 500 }
    );
  }
}
