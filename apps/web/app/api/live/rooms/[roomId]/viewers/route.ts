import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getRedisClient } from '@/lib/redis';

export const dynamic = 'force-dynamic';

/**
 * POST /api/live/rooms/[roomId]/viewers
 * Register a viewer joining the live room.
 * Prevents duplicate session counting.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;
    const body = await req.json().catch(() => ({}));
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId);

    // Verify room exists
    const roomRows = await query<any>(
      `SELECT id, room_number, viewer_count, status, is_live
       FROM popolive.live_rooms
       WHERE ${isUuid ? 'id = $1' : 'room_number = $1'}
       LIMIT 1`,
      [roomId]
    );

    if (roomRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Live room not found.', code: 'ROOM_NOT_FOUND' }, { status: 404 });
    }

    const room = roomRows[0];
    const user = await getAuthenticatedUser(req).catch(() => null);
    const sessionId = (body.sessionId || req.cookies.get('poppo_session')?.value || `anon_${crypto.randomBytes(8).toString('hex')}`).trim();

    // Check if this viewer session is ALREADY actively counted in this room
    const existingActive = await query<any>(
      `SELECT id FROM popolive.live_room_viewers
       WHERE room_id = $1 AND session_id = $2 AND is_active = true
       LIMIT 1`,
      [room.id, sessionId]
    );

    let activeViewerCount = Number(room.viewer_count) || 0;

    if (existingActive.length === 0) {
      // 1. Insert new viewer presence
      await query(
        `INSERT INTO popolive.live_room_viewers (
          room_id, viewer_id, session_id, is_active, joined_at, last_heartbeat
        ) VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [room.id, user ? user.id : null, sessionId]
      );

      // 2. Increment room viewer count atomically
      const updated = await query<any>(
        `UPDATE popolive.live_rooms
         SET viewer_count = COALESCE(viewer_count, 0) + 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING viewer_count`,
        [room.id]
      );

      activeViewerCount = Number(updated[0]?.viewer_count) || activeViewerCount + 1;

      // 3. Sync with Redis set if available
      try {
        const redis = getRedisClient();
        await redis.sadd(`room:${room.id}:viewers`, sessionId);
        await redis.expire(`room:${room.id}:viewers`, 3600);
      } catch (redisErr) {
        // Safe fallback; database remains source of truth
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Viewer joined live broadcast room.',
      roomId: room.id,
      roomNumber: room.room_number,
      sessionId,
      viewerCount: activeViewerCount,
      viewerDisplay: activeViewerCount >= 1000 ? `${(activeViewerCount / 1000).toFixed(1)}K` : String(activeViewerCount),
    });
  } catch (err: any) {
    console.error(`POST /api/live/rooms/${params.roomId}/viewers error:`, err);
    return NextResponse.json({ success: false, error: 'Failed to register viewer join.' }, { status: 500 });
  }
}

/**
 * DELETE /api/live/rooms/[roomId]/viewers
 * Deregister a viewer leaving the live room.
 * Decrements viewer count with non-negative guard (GREATEST(0, viewer_count - 1)).
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;
    const body = await req.json().catch(() => ({}));
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId);

    const roomRows = await query<any>(
      `SELECT id, room_number, viewer_count
       FROM popolive.live_rooms
       WHERE ${isUuid ? 'id = $1' : 'room_number = $1'}
       LIMIT 1`,
      [roomId]
    );

    if (roomRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Live room not found.' }, { status: 404 });
    }

    const room = roomRows[0];
    const sessionId = (body.sessionId || req.cookies.get('poppo_session')?.value || '').trim();

    if (sessionId) {
      // Mark presence inactive
      const presenceRes = await query<any>(
        `UPDATE popolive.live_room_viewers
         SET is_active = false, left_at = CURRENT_TIMESTAMP
         WHERE room_id = $1 AND session_id = $2 AND is_active = true
         RETURNING id`,
        [room.id, sessionId]
      );

      if (presenceRes.length > 0) {
        // Decrement room viewer count with non-negative protection
        await query(
          `UPDATE popolive.live_rooms
           SET viewer_count = GREATEST(0, COALESCE(viewer_count, 1) - 1),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [room.id]
        );

        // Remove from Redis set
        try {
          const redis = getRedisClient();
          await redis.srem(`room:${room.id}:viewers`, sessionId);
        } catch {}
      }
    }

    const updated = await query<any>(
      `SELECT viewer_count FROM popolive.live_rooms WHERE id = $1`,
      [room.id]
    );

    const count = Number(updated[0]?.viewer_count) || 0;

    return NextResponse.json({
      success: true,
      message: 'Viewer left live broadcast room.',
      roomId: room.id,
      roomNumber: room.room_number,
      viewerCount: count,
      viewerDisplay: count >= 1000 ? `${(count / 1000).toFixed(1)}K` : String(count),
    });
  } catch (err: any) {
    console.error(`DELETE /api/live/rooms/${params.roomId}/viewers error:`, err);
    return NextResponse.json({ success: false, error: 'Failed to deregister viewer.' }, { status: 500 });
  }
}
