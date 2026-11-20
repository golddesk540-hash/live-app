import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

function formatDuration(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * GET /api/live/hosts/[hostId]/history
 * Retrieve past live broadcasting sessions for a host.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { hostId: string } }
) {
  try {
    const hostId = params.hostId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(hostId);

    const hostRows = await query<any>(
      `SELECT id, nickname FROM popolive.users WHERE ${isUuid ? 'id = $1' : 'poppo_id = $1'} LIMIT 1`,
      [hostId]
    );

    if (hostRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Host not found.' }, { status: 404 });
    }

    const host = hostRows[0];

    const historyRows = await query<any>(
      `SELECT id, room_number, title, cover_url, category, status,
              started_at, ended_at, duration_seconds, viewer_count, peak_viewer_count,
              coins_earned, points_received
       FROM popolive.live_rooms
       WHERE host_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [host.id]
    );

    const sessions = historyRows.map((r) => {
      const dur = Number(r.duration_seconds) || 0;
      return {
        id: r.id,
        roomNumber: r.room_number,
        title: r.title,
        coverUrl: r.cover_url,
        category: r.category,
        status: r.status,
        startedAt: r.started_at,
        endedAt: r.ended_at,
        durationSeconds: dur,
        durationFormatted: formatDuration(dur),
        viewerCount: Number(r.viewer_count) || 0,
        peakViewers: Number(r.peak_viewer_count) || 0,
        coinsEarned: Number(r.coins_earned) || 0,
        pointsReceived: Number(r.points_received) || 0,
      };
    });

    return NextResponse.json({
      success: true,
      hostId: host.id,
      hostNickname: host.nickname,
      totalSessions: sessions.length,
      sessions,
    });
  } catch (err: any) {
    console.error(`GET /api/live/hosts/${params.hostId}/history error:`, err);
    return NextResponse.json({ success: false, error: 'Failed to retrieve broadcast history.' }, { status: 500 });
  }
}
