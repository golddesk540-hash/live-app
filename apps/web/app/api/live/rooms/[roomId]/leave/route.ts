import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/live/rooms/[roomId]/leave
 * Register a viewer leaving a live broadcast room.
 * Performs atomic viewer count decrement with non-negative guard.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;
    if (!roomId) {
      return NextResponse.json({ success: false, error: 'Room ID is required.' }, { status: 400 });
    }

    const user = await getAuthenticatedUser(req);
    const body = await req.json().catch(() => ({}));
    const sessionId = (body.sessionId || req.cookies.get('poppo_session')?.value || '').trim();

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId);
    const roomRows = await query<any>(
      `SELECT id, room_number, viewer_count FROM popolive.live_rooms WHERE ${isUuid ? 'id = $1' : 'room_number = $1'} LIMIT 1`,
      [roomId]
    );

    if (roomRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Live room not found.', code: 'ROOM_NOT_FOUND' }, { status: 404 });
    }

    const room = roomRows[0];

    // Mark viewer presence as inactive
    if (sessionId || user?.id) {
      await query(
        `UPDATE popolive.live_room_viewers
         SET is_active = false, left_at = CURRENT_TIMESTAMP
         WHERE room_id = $1 AND (session_id = $2 OR ($3::uuid IS NOT NULL AND viewer_id = $3::uuid)) AND is_active = true`,
        [room.id, sessionId || null, user?.id || null]
      );
    }

    // Atomically decrement viewer count with non-negative lower bound
    const updated = await query<any>(
      `UPDATE popolive.live_rooms
       SET viewer_count = GREATEST(0, viewer_count - 1),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING viewer_count`,
      [room.id]
    );

    const newCount = updated.length > 0 ? Number(updated[0].viewer_count) : 0;

    const formatDisplay = (count: number) => {
      if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
      if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
      return String(count);
    };

    return NextResponse.json({
      success: true,
      message: 'Left live broadcast room.',
      roomId: room.id,
      roomNumber: room.room_number,
      viewerCount: newCount,
      viewerDisplay: formatDisplay(newCount),
    });
  } catch (err: any) {
    console.error(`POST /api/live/rooms/${params.roomId}/leave error:`, err);
    return NextResponse.json({ success: false, error: 'Failed to process room departure.' }, { status: 500 });
  }
}
