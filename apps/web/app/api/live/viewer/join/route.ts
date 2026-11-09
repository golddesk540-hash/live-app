import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const roomId = body.roomId;
    const isDemo = body.isDemo === true || req.nextUrl.searchParams.get('preview') === 'demo';

    if (isDemo || !roomId || roomId === 'demo-room-404' || roomId === 'demo') {
      return NextResponse.json({
        success: true,
        message: 'Viewer joined demo room',
        viewerCount: 7601,
        viewerDisplay: '7.6K',
      });
    }

    const user = await getAuthenticatedUser(req).catch(() => null);
    const sessionId = body.sessionId || req.cookies.get('poppo_session')?.value || `anon_${crypto.randomBytes(8).toString('hex')}`;

    // Verify room exists
    const roomRows = await query(
      `SELECT id, viewer_count, status, is_live FROM popolive.live_rooms WHERE id = $1 LIMIT 1`,
      [roomId]
    );

    if (roomRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Room not found.' }, { status: 404 });
    }

    const room = roomRows[0];

    // Check if viewer already active in room
    const existingPresence = await query(
      `SELECT id FROM popolive.live_room_viewers 
       WHERE room_id = $1 AND session_id = $2 AND is_active = true
       LIMIT 1`,
      [roomId, sessionId]
    );

    let updatedCount = Number(room.viewer_count) || 0;

    if (existingPresence.length === 0) {
      // Record new presence
      await query(
        `INSERT INTO popolive.live_room_viewers (
          room_id, viewer_id, session_id, is_active, joined_at, last_heartbeat
        ) VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [roomId, user ? user.id : null, sessionId]
      );

      // Increment room viewer count
      const updateRes = await query(
        `UPDATE popolive.live_rooms
         SET viewer_count = COALESCE(viewer_count, 0) + 1,
             peak_viewer_count = GREATEST(COALESCE(peak_viewer_count, 0), COALESCE(viewer_count, 0) + 1),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING viewer_count`,
        [roomId]
      );

      if (updateRes.length > 0) {
        updatedCount = Number(updateRes[0].viewer_count);
      }
    } else {
      // Update heartbeat
      await query(
        `UPDATE popolive.live_room_viewers
         SET last_heartbeat = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [existingPresence[0].id]
      );
    }

    let viewerDisplay = String(updatedCount);
    if (updatedCount >= 1000) {
      viewerDisplay = `${(updatedCount / 1000).toFixed(1)}K`;
    }

    return NextResponse.json({
      success: true,
      message: 'Joined live broadcast stream',
      viewerCount: updatedCount,
      viewerDisplay,
    });
  } catch (err: any) {
    console.error('Error in POST /api/live/viewer/join:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
