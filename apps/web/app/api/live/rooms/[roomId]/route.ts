import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { generateHostRtcToken } from '@/lib/agora';

export const dynamic = 'force-dynamic';

/**
 * GET /api/live/rooms/[roomId]
 * Retrieve live room details by ID (UUID) or room_number.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;
    if (!roomId) {
      return NextResponse.json({ success: false, error: 'Room ID is required.' }, { status: 400 });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId);
    const sql = `
      SELECT 
        lr.id,
        lr.room_number,
        lr.host_id,
        lr.title,
        lr.cover_url,
        lr.category,
        lr.status,
        lr.is_live,
        lr.is_pk,
        lr.viewer_count,
        lr.coins_earned,
        lr.country,
        lr.country_code,
        lr.flag_emoji,
        lr.agora_channel_name,
        lr.agora_uid,
        lr.started_at,
        lr.ended_at,
        lr.created_at,
        u.nickname AS host_nickname,
        u.poppo_id AS host_poppo_id,
        u.avatar_url AS host_avatar_url,
        COALESCE(u.wealth_level, 1) AS host_wealth_level,
        COALESCE(u.host_level, 1) AS host_level
      FROM popolive.live_rooms lr
      JOIN popolive.users u ON lr.host_id = u.id
      WHERE ${isUuid ? 'lr.id = $1' : 'lr.room_number = $1'}
      LIMIT 1
    `;

    const rows = await query<any>(sql, [roomId]);

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Live room not found.', code: 'ROOM_NOT_FOUND' },
        { status: 404 }
      );
    }

    const r = rows[0];
    const viewerCount = Number(r.viewer_count) || 0;

    return NextResponse.json({
      success: true,
      room: {
        id: r.id,
        roomNumber: r.room_number,
        title: r.title,
        coverUrl: r.cover_url || '/assets/viewer/sample_viewer_broadcast.png',
        category: r.category || 'Live Chat',
        status: r.status,
        isLive: r.is_live,
        isPk: Boolean(r.is_pk),
        viewerCount,
        viewerDisplay: viewerCount >= 1000 ? `${(viewerCount / 1000).toFixed(1)}K` : String(viewerCount),
        country: r.country,
        countryCode: r.country_code,
        flagEmoji: r.flag_emoji || '🇵🇰',
        startedAt: r.started_at,
        endedAt: r.ended_at,
        agoraChannelName: r.agora_channel_name,
        host: {
          id: r.host_id,
          nickname: r.host_nickname,
          poppoId: r.host_poppo_id,
          avatarUrl: r.host_avatar_url,
          wealthLevel: Number(r.host_wealth_level) || 1,
          hostLevel: Number(r.host_level) || 1,
        },
      },
    });
  } catch (err: any) {
    console.error(`GET /api/live/rooms/${params.roomId} error:`, err);
    return NextResponse.json({ success: false, error: 'Failed to retrieve room details.' }, { status: 500 });
  }
}

/**
 * PATCH /api/live/rooms/[roomId]
 * Update live room details.
 * Host ownership validation required.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const roomId = params.roomId;
    const body = await req.json().catch(() => ({}));

    // Verify room exists and belongs to authenticated host
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId);
    const existing = await query<any>(
      `SELECT id, host_id, status FROM popolive.live_rooms WHERE ${isUuid ? 'id = $1' : 'room_number = $1'} LIMIT 1`,
      [roomId]
    );

    if (existing.length === 0) {
      return NextResponse.json({ success: false, error: 'Room not found.' }, { status: 404 });
    }

    const room = existing[0];
    if (room.host_id !== user.id && !user.is_staff) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. You do not own this live room.', code: 'FORBIDDEN_NOT_ROOM_OWNER' },
        { status: 403 }
      );
    }

    const updateFields: string[] = [];
    const updateParams: any[] = [room.id];

    if (body.title && typeof body.title === 'string' && body.title.trim().length >= 3) {
      updateParams.push(body.title.trim());
      updateFields.push(`title = $${updateParams.length}`);
    }

    if (body.category && typeof body.category === 'string') {
      updateParams.push(body.category.trim());
      updateFields.push(`category = $${updateParams.length}`);
    }

    if (body.coverUrl && typeof body.coverUrl === 'string') {
      updateParams.push(body.coverUrl.trim());
      updateFields.push(`cover_url = $${updateParams.length}`);
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ success: false, error: 'No valid fields provided to update.' }, { status: 400 });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');

    const updateSql = `
      UPDATE popolive.live_rooms
      SET ${updateFields.join(', ')}
      WHERE id = $1
      RETURNING id, room_number, title, category, cover_url, status, is_live, updated_at
    `;

    const updated = await query<any>(updateSql, updateParams);

    return NextResponse.json({
      success: true,
      message: 'Room details updated successfully.',
      room: updated[0],
    });
  } catch (err: any) {
    console.error(`PATCH /api/live/rooms/${params.roomId} error:`, err);
    return NextResponse.json({ success: false, error: 'Failed to update live room.' }, { status: 500 });
  }
}
