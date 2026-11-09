import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { PartySeat, generateDefaultSeats } from '@/lib/party';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;

    // 1. Fetch existing seats from DB
    let dbSeats: any[] = [];
    try {
      dbSeats = await query(
        `SELECT id, party_id, room_number, seat_number, participant_id, participant_name, 
                participant_avatar, is_host, is_muted, is_camera_on, is_host_muted, is_video_disabled,
                camera_facing, status, occupied_at, updated_at
         FROM popolive.party_seats
         WHERE room_number = $1
         ORDER BY seat_number ASC`,
        [roomId]
      );
    } catch (dbErr) {
      console.warn('DB query party_seats error:', dbErr);
    }

    // 2. If no seats exist in DB yet, attempt to fetch room host info and auto-seed
    if (!dbSeats || dbSeats.length === 0) {
      let hostNickname = roomId === '7001' ? 'Maria Live' : 'Host ' + roomId;
      let hostAvatar = '/assets/studio/host_zara_avatar.png';
      let partyId: string | null = null;

      try {
        const roomRow = await query(
          `SELECT id, host_nickname, host_avatar FROM popolive.party_rooms WHERE room_number = $1 OR id::text = $1 LIMIT 1`,
          [roomId]
        );
        if (roomRow && roomRow[0]) {
          hostNickname = roomRow[0].host_nickname || hostNickname;
          hostAvatar = roomRow[0].host_avatar || hostAvatar;
          partyId = roomRow[0].id;
        }
      } catch {}

      try {
        await query(
          `INSERT INTO popolive.party_seats (party_id, room_number, seat_number, participant_id, participant_name, participant_avatar, is_host, is_muted, is_camera_on, status, occupied_at)
           VALUES
             ($1, $2, 1, $3, $4, $5, true, false, true, 'occupied', NOW()),
             ($1, $2, 2, NULL, NULL, NULL, false, false, false, 'available', NULL),
             ($1, $2, 3, NULL, NULL, NULL, false, false, false, 'available', NULL),
             ($1, $2, 4, NULL, NULL, NULL, false, false, false, 'available', NULL),
             ($1, $2, 5, NULL, NULL, NULL, false, false, false, 'available', NULL),
             ($1, $2, 6, NULL, NULL, NULL, false, false, false, 'available', NULL),
             ($1, $2, 7, NULL, NULL, NULL, false, false, false, 'available', NULL),
             ($1, $2, 8, NULL, NULL, NULL, false, false, false, 'available', NULL),
             ($1, $2, 9, NULL, NULL, NULL, false, false, false, 'available', NULL)
           ON CONFLICT (room_number, seat_number) DO NOTHING`,
          [partyId, roomId, 'host_' + roomId, hostNickname, hostAvatar]
        );

        dbSeats = await query(
          `SELECT id, party_id, room_number, seat_number, participant_id, participant_name, 
                  participant_avatar, is_host, is_muted, is_camera_on, status, occupied_at, updated_at
           FROM popolive.party_seats
           WHERE room_number = $1
           ORDER BY seat_number ASC`,
          [roomId]
        );
      } catch (insertErr) {
        console.warn('DB auto-seed seats error:', insertErr);
      }
    }

    // 3. Transform to typed response
    let seats: PartySeat[] = [];
    if (dbSeats && dbSeats.length > 0) {
      seats = dbSeats.map((row) => ({
        id: row.id,
        roomNumber: row.room_number,
        seatNumber: Number(row.seat_number),
        participantId: row.participant_id,
        participantName: row.participant_name,
        participantAvatar: row.participant_avatar,
        isHost: Boolean(row.is_host),
        isMuted: Boolean(row.is_muted),
        isCameraOn: Boolean(row.is_camera_on),
        isHostMuted: Boolean(row.is_host_muted),
        isVideoDisabled: Boolean(row.is_video_disabled),
        cameraFacing: row.camera_facing || 'user',
        status: row.status,
        occupiedAt: row.occupied_at ? new Date(row.occupied_at).toISOString() : null,
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
      }));
    } else {
      // In-memory fallback
      seats = generateDefaultSeats(roomId, roomId === '7001' ? 'Maria Live' : 'Host Live');
    }

    // Always ensure exactly 9 seats (Seat 1 to 9)
    if (seats.length < 9) {
      const existingNums = new Set(seats.map((s) => s.seatNumber));
      for (let i = 1; i <= 9; i++) {
        if (!existingNums.has(i)) {
          seats.push({
            id: `seat-${roomId}-${i}`,
            roomNumber: roomId,
            seatNumber: i,
            participantId: i === 1 ? 'host_' + roomId : null,
            participantName: i === 1 ? 'Maria Live' : null,
            participantAvatar: i === 1 ? '/assets/studio/host_zara_avatar.png' : null,
            isHost: i === 1,
            isMuted: false,
            isCameraOn: i <= 6,
            isHostMuted: false,
            isVideoDisabled: false,
            cameraFacing: 'user',
            status: i <= 6 ? 'occupied' : 'available',
            occupiedAt: i <= 6 ? new Date().toISOString() : null,
            updatedAt: new Date().toISOString(),
          });
        }
      }
      seats.sort((a, b) => a.seatNumber - b.seatNumber);
    }

    return NextResponse.json({
      success: true,
      roomNumber: roomId,
      totalSeats: seats.length,
      occupiedCount: seats.filter((s) => s.status === 'occupied').length,
      availableCount: seats.filter((s) => s.status === 'available').length,
      seats,
    });
  } catch (error: any) {
    console.error('API /party/[roomId]/seats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve party seats' },
      { status: 500 }
    );
  }
}
