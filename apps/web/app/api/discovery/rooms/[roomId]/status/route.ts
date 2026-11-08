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
      `SELECT id, room_number, status, is_live, is_pk, viewer_count, coins_earned, started_at, ended_at, updated_at
       FROM popolive.live_rooms
       WHERE ${whereSql}
       LIMIT 1`,
      [roomId]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Room not found.',
        status: 'ended',
        isLive: false,
      }, { status: 404 });
    }

    const r = rows[0];
    const isLive = Boolean(r.is_live && r.status === 'live');

    return NextResponse.json({
      success: true,
      roomId: r.id,
      roomNumber: r.room_number,
      status: r.status,
      isLive,
      isPk: Boolean(r.is_pk),
      viewerCount: r.viewer_count || 0,
      viewersFormatted: formatMetric(r.viewer_count || 0),
      coinsEarned: parseInt(r.coins_earned || '0', 10),
      coinsFormatted: formatMetric(parseInt(r.coins_earned || '0', 10)),
      startedAt: r.started_at,
      endedAt: r.ended_at,
      updatedAt: r.updated_at,
    });
  } catch (error: any) {
    console.error('Error checking room status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check room status', details: error.message },
      { status: 500 }
    );
  }
}
