import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

function formatMetric(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
}

export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { roomId } = params;
    if (!roomId) {
      return NextResponse.json({ success: false, error: 'Room ID is required.' }, { status: 400 });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId);
    const whereSql = isUuid ? 'id = $1' : 'room_number = $1';

    const rows = await query<any>(
      `SELECT id, room_number, viewer_count, status, is_live
       FROM popolive.live_rooms
       WHERE ${whereSql}
       LIMIT 1`,
      [roomId]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Room not found.',
      }, { status: 404 });
    }

    const r = rows[0];
    const viewerCount = r.viewer_count || 0;
    // Calculate approximate peak (or 10-15% above current count)
    const peakViewers = Math.round(viewerCount * 1.15);

    // Get a sample of recent viewers from active platform users
    const sampleViewers = await query<any>(
      `SELECT id, poppo_id, nickname, avatar_url, host_level, wealth_level
       FROM popolive.users
       WHERE status = 'active'
       ORDER BY wealth_level DESC, created_at ASC
       LIMIT 6`
    );

    return NextResponse.json({
      success: true,
      roomId: r.id,
      roomNumber: r.room_number,
      isLive: Boolean(r.is_live && r.status === 'live'),
      viewerCount,
      viewersFormatted: formatMetric(viewerCount),
      peakViewers,
      peakViewersFormatted: formatMetric(peakViewers),
      recentViewers: sampleViewers.map((v) => ({
        id: v.id,
        poppoId: v.poppo_id,
        nickname: v.nickname,
        avatarUrl: v.avatar_url || '/avatars/default.png',
        wealthLevel: v.wealth_level || 1,
        hostLevel: v.host_level || 1,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching room viewers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch viewers', details: error.message },
      { status: 500 }
    );
  }
}
