import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/live/hosts/[hostId]/status
 * Retrieve live broadcasting status and active room for a given host.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { hostId: string } }
) {
  try {
    const hostId = params.hostId;
    if (!hostId) {
      return NextResponse.json({ success: false, error: 'Host ID required.' }, { status: 400 });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(hostId);

    // Fetch host user details
    const hostRows = await query<any>(
      `SELECT id, poppo_id, nickname, avatar_url, wealth_level, host_level, country, country_code, status
       FROM popolive.users
       WHERE ${isUuid ? 'id = $1' : 'poppo_id = $1'}
       LIMIT 1`,
      [hostId]
    );

    if (hostRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Host not found.', code: 'HOST_NOT_FOUND' }, { status: 404 });
    }

    const host = hostRows[0];
    const wealthLevel = Number(host.wealth_level) || 1;

    // Check if host has an active live room right now
    const activeRoomRows = await query<any>(
      `SELECT id, room_number, title, cover_url, category, viewer_count, started_at
       FROM popolive.live_rooms
       WHERE host_id = $1 AND is_live = true AND status = 'live'
       LIMIT 1`,
      [host.id]
    );

    const isLive = activeRoomRows.length > 0;
    const activeRoom = isLive ? activeRoomRows[0] : null;

    return NextResponse.json({
      success: true,
      host: {
        id: host.id,
        poppoId: host.poppo_id,
        nickname: host.nickname,
        avatarUrl: host.avatar_url,
        wealthLevel,
        hostLevel: Number(host.host_level) || 1,
        isLive,
        canGoLive: wealthLevel >= 5,
        requiredWealthLevel: 5,
        activeRoom: activeRoom ? {
          id: activeRoom.id,
          roomNumber: activeRoom.room_number,
          title: activeRoom.title,
          coverUrl: activeRoom.cover_url,
          category: activeRoom.category,
          viewerCount: Number(activeRoom.viewer_count) || 0,
          startedAt: activeRoom.started_at,
        } : null,
      },
    });
  } catch (err: any) {
    console.error(`GET /api/live/hosts/${params.hostId}/status error:`, err);
    return NextResponse.json({ success: false, error: 'Failed to retrieve host status.' }, { status: 500 });
  }
}
