import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/live/rooms/[roomId]/join
 * Register a viewer joining a live broadcast room.
 * Performs atomic viewer count increment and session registration.
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
    const sessionId = (body.sessionId || req.cookies.get('poppo_session')?.value || `viewer_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`).trim();

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId);
    const roomRows = await query<any>(
      `SELECT id, room_number, viewer_count, peak_viewer_count, status, is_live
       FROM popolive.live_rooms
       WHERE ${isUuid ? 'id = $1' : 'room_number = $1'}
       LIMIT 1`,
      [roomId]
    );

    if (roomRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Live room not found.', code: 'ROOM_NOT_FOUND' }, { status: 404 });
    }

    const room = roomRows[0];

    // Check duplicate active presence for this user/session to avoid double-counting
    const existingPresence = await query<any>(
      `SELECT id FROM popolive.live_room_viewers
       WHERE room_id = $1 AND (session_id = $2 OR ($3::uuid IS NOT NULL AND viewer_id = $3::uuid)) AND is_active = true
       LIMIT 1`,
      [room.id, sessionId, user?.id || null]
    );

    let newCount = Number(room.viewer_count) || 0;

    if (existingPresence.length === 0) {
      // Record new active presence
      await query(
        `INSERT INTO popolive.live_room_viewers (
          id, room_id, viewer_id, session_id, joined_at, is_active
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, CURRENT_TIMESTAMP, true
        )`,
        [room.id, user?.id || null, sessionId]
      );

      // Atomically increment viewer count and track peak viewer count
      const updated = await query<any>(
        `UPDATE popolive.live_rooms
         SET viewer_count = viewer_count + 1,
             peak_viewer_count = GREATEST(peak_viewer_count, viewer_count + 1),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING viewer_count, peak_viewer_count`,
        [room.id]
      );

      if (updated.length > 0) {
        newCount = Number(updated[0].viewer_count);
      }
    }

    const formatDisplay = (count: number) => {
      if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
      if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
      return String(count);
    };

    return NextResponse.json({
      success: true,
      message: 'Joined live broadcast room.',
      roomId: room.id,
      roomNumber: room.room_number,
      sessionId,
      viewerCount: newCount,
      viewerDisplay: formatDisplay(newCount),
    });
  } catch (err: any) {
    console.error(`POST /api/live/rooms/${params.roomId}/join error:`, err);
    return NextResponse.json({ success: false, error: 'Failed to join live room.' }, { status: 500 });
  }
}
