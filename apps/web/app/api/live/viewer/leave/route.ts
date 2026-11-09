import { NextRequest, NextResponse } from 'next/server';
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
        message: 'Viewer left demo room',
        viewerCount: 7600,
        viewerDisplay: '7.6K',
      });
    }

    const sessionId = body.sessionId || req.cookies.get('poppo_session')?.value;

    if (sessionId) {
      // Mark presence inactive
      const presenceRes = await query(
        `UPDATE popolive.live_room_viewers
         SET is_active = false,
             left_at = CURRENT_TIMESTAMP
         WHERE room_id = $1 AND session_id = $2 AND is_active = true
         RETURNING id`,
        [roomId, sessionId]
      );

      if (presenceRes.length > 0) {
        // Decrement room viewer count
        await query(
          `UPDATE popolive.live_rooms
           SET viewer_count = GREATEST(0, COALESCE(viewer_count, 1) - 1),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [roomId]
        );
      }
    }

    const updatedRoom = await query(
      `SELECT viewer_count FROM popolive.live_rooms WHERE id = $1 LIMIT 1`,
      [roomId]
    );

    const count = updatedRoom.length > 0 ? Number(updatedRoom[0].viewer_count) : 0;
    let viewerDisplay = String(count);
    if (count >= 1000) {
      viewerDisplay = `${(count / 1000).toFixed(1)}K`;
    }

    return NextResponse.json({
      success: true,
      message: 'Viewer successfully left live broadcast',
      viewerCount: count,
      viewerDisplay,
    });
  } catch (err: any) {
    console.error('Error in POST /api/live/viewer/leave:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
