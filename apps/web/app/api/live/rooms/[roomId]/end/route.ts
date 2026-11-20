import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

function formatDuration(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * POST /api/live/rooms/[roomId]/end
 * Finalize and end a broadcast session.
 * Host ownership required.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const roomId = params.roomId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId);

    const roomRows = await query<any>(
      `SELECT id, room_number, host_id, title, cover_url, category, status, is_live,
              started_at, ended_at, viewer_count, peak_viewer_count, duration_seconds
       FROM popolive.live_rooms
       WHERE ${isUuid ? 'id = $1' : 'room_number = $1'}
       LIMIT 1`,
      [roomId]
    );

    if (roomRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Live room not found.' }, { status: 404 });
    }

    const room = roomRows[0];
    if (room.host_id !== user.id && !user.is_staff) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. Only the broadcaster can end this live room.', code: 'FORBIDDEN_NOT_ROOM_OWNER' },
        { status: 403 }
      );
    }

    // If already ended, return previous summary idempotently
    if (room.status === 'ended' && !room.is_live) {
      const dur = Number(room.duration_seconds) || 3600;
      return NextResponse.json({
        success: true,
        alreadyEnded: true,
        message: 'Broadcast session has already ended.',
        summary: {
          roomId: room.id,
          roomNumber: room.room_number,
          title: room.title,
          status: 'ended',
          durationSeconds: dur,
          durationFormatted: formatDuration(dur),
          viewerCount: Number(room.viewer_count) || 0,
          peakViewers: Number(room.peak_viewer_count) || 0,
        },
      });
    }

    // Compute duration
    const now = new Date();
    const startedAt = room.started_at ? new Date(room.started_at) : new Date(now.getTime() - 1800000);
    const durationSeconds = Math.max(1, Math.floor((now.getTime() - startedAt.getTime()) / 1000));
    const peakViewers = Math.max(Number(room.viewer_count) || 0, Number(room.peak_viewer_count) || 0);

    // End session in database
    await query(
      `UPDATE popolive.live_rooms
       SET status = 'ended',
           is_live = false,
           ended_at = CURRENT_TIMESTAMP,
           duration_seconds = $2,
           peak_viewer_count = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [room.id, durationSeconds, peakViewers]
    );

    // Mark active viewers as inactive
    await query(
      `UPDATE popolive.live_room_viewers
       SET is_active = false, left_at = CURRENT_TIMESTAMP
       WHERE room_id = $1 AND is_active = true`,
      [room.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Live broadcast ended successfully.',
      summary: {
        roomId: room.id,
        roomNumber: room.room_number,
        title: room.title,
        category: room.category,
        status: 'ended',
        isLive: false,
        startedAt: startedAt.toISOString(),
        endedAt: now.toISOString(),
        durationSeconds,
        durationFormatted: formatDuration(durationSeconds),
        totalViewers: Number(room.viewer_count) || 0,
        peakViewers,
      },
    });
  } catch (err: any) {
    console.error(`POST /api/live/rooms/${params.roomId}/end error:`, err);
    return NextResponse.json({ success: false, error: 'Failed to end live broadcast.' }, { status: 500 });
  }
}
