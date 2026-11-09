import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ModerateSeatMediaDto } from '@/lib/party';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;
    const body = await req.json();
    const seatNumber = Number(body.seatNumber);
    const action = String(body.action || '');
    const isHostAction = Boolean(body.isHostAction);

    if (!seatNumber || seatNumber < 1 || seatNumber > 9) {
      return NextResponse.json(
        { success: false, error: 'Invalid seat number. Must be between 1 and 9.' },
        { status: 400 }
      );
    }

    if (seatNumber === 1) {
      return NextResponse.json(
        { success: false, error: 'Host seat cannot be moderated via this endpoint.' },
        { status: 400 }
      );
    }

    if (!isHostAction) {
      return NextResponse.json(
        { success: false, error: 'Only the party host can perform seat moderation.' },
        { status: 403 }
      );
    }

    // SECURITY CONSTRAINT: Host cannot secretly or forcibly turn on a participant's mic or camera
    if (action === 'force_unmute' || action === 'force_camera_on' || action === 'force_enable_media') {
      return NextResponse.json(
        {
          success: false,
          error: "Permission denied: Host cannot secretly or forcibly activate a participant's microphone or camera. Participant retains exclusive reactivation control.",
          code: 'SECURITY_CONSENT_VIOLATION',
        },
        { status: 403 }
      );
    }

    // 1. Fetch target seat
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
        { success: false, error: `Seat #${seatNumber} is not currently occupied.` },
        { status: 400 }
      );
    }

    let updatedRow: any = null;
    let message = '';

    if (action === 'host_mute') {
      // Host mutes participant
      const res = await query(
        `UPDATE popolive.party_seats
         SET is_muted = true, is_host_muted = true, updated_at = NOW()
         WHERE room_number = $1 AND seat_number = $2
         RETURNING *`,
        [roomId, seatNumber]
      );
      updatedRow = res[0];
      message = `Host muted participant ${currentSeat.participant_name} on Seat #${seatNumber}`;
    } else if (action === 'disable_video') {
      // Host disables participant video stream
      const res = await query(
        `UPDATE popolive.party_seats
         SET is_camera_on = false, is_video_disabled = true, updated_at = NOW()
         WHERE room_number = $1 AND seat_number = $2
         RETURNING *`,
        [roomId, seatNumber]
      );
      updatedRow = res[0];
      message = `Host disabled video publishing for participant ${currentSeat.participant_name} on Seat #${seatNumber}`;
    } else if (action === 'kick') {
      // Host removes participant from seat
      const res = await query(
        `UPDATE popolive.party_seats
         SET participant_id = NULL, participant_name = NULL, participant_avatar = NULL,
             is_host = false, is_muted = false, is_camera_on = false,
             is_host_muted = false, is_video_disabled = false, camera_facing = 'user',
             status = 'available', occupied_at = NULL, updated_at = NOW()
         WHERE room_number = $1 AND seat_number = $2
         RETURNING *`,
        [roomId, seatNumber]
      );
      updatedRow = res[0];
      message = `Host vacated participant ${currentSeat.participant_name} from Seat #${seatNumber}`;
    } else {
      return NextResponse.json(
        { success: false, error: `Unsupported moderation action: ${action}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message,
      moderatedSeat: {
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
    console.error('API /party/[roomId]/seats/media/moderate error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to moderate seat media' },
      { status: 500 }
    );
  }
}
