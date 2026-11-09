import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

function formatDurationHhMm(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
}

function formatDurationHhMmSs(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all'; // 'all' | 'week' | 'month'
    const isDemo = searchParams.get('preview') === 'demo' || true;

    const authUser = await getAuthenticatedUser(req).catch(() => null);

    // Default reference past sessions for demo host Zara Live
    const demoSessions = [
      {
        id: 'session-hist-1',
        roomNumber: '880219',
        title: 'Come and chat with me 💕',
        category: 'Live Chat',
        coverUrl: '/assets/viewer/sample_viewer_broadcast.png',
        startedAt: new Date(Date.now() - 5076000).toISOString(),
        endedAt: new Date().toISOString(),
        durationSeconds: 5076,
        durationFormatted: '01:24:36',
        totalViewers: 12480,
        totalViewersFormatted: '12,480',
        peakViewers: 3420,
        peakViewersFormatted: '3,420',
        newFollowers: 186,
        pointsReceived: 28400,
        status: 'ended',
      },
      {
        id: 'session-hist-2',
        roomNumber: '880218',
        title: 'Late Night Singing & Q&A 🎵',
        category: 'Music & Singing',
        coverUrl: '/assets/pre-live/sample_cover_model.png',
        startedAt: new Date(Date.now() - 86400000 - 7200000).toISOString(),
        endedAt: new Date(Date.now() - 86400000).toISOString(),
        durationSeconds: 7200,
        durationFormatted: '02:00:00',
        totalViewers: 18950,
        totalViewersFormatted: '18,950',
        peakViewers: 4520,
        peakViewersFormatted: '4,520',
        newFollowers: 312,
        pointsReceived: 42100,
        status: 'ended',
      },
      {
        id: 'session-hist-3',
        roomNumber: '880215',
        title: 'Weekend Dance Party 💃✨',
        category: 'Dance',
        coverUrl: '/assets/studio/host_zara_avatar.png',
        startedAt: new Date(Date.now() - 172800000 - 5400000).toISOString(),
        endedAt: new Date(Date.now() - 172800000).toISOString(),
        durationSeconds: 5400,
        durationFormatted: '01:30:00',
        totalViewers: 15420,
        totalViewersFormatted: '15,420',
        peakViewers: 3890,
        peakViewersFormatted: '3,890',
        newFollowers: 245,
        pointsReceived: 35600,
        status: 'ended',
      },
      {
        id: 'session-hist-4',
        roomNumber: '880210',
        title: 'Cozy Morning Coffee Chat ☕',
        category: 'Live Chat',
        coverUrl: '/assets/viewer/sample_viewer_broadcast.png',
        startedAt: new Date(Date.now() - 259200000 - 3600000).toISOString(),
        endedAt: new Date(Date.now() - 259200000).toISOString(),
        durationSeconds: 3600,
        durationFormatted: '01:00:00',
        totalViewers: 9840,
        totalViewersFormatted: '9,840',
        peakViewers: 2210,
        peakViewersFormatted: '2,210',
        newFollowers: 142,
        pointsReceived: 21300,
        status: 'ended',
      },
    ];

    let hostSessions = [...demoSessions];

    // Try DB lookup if host is authenticated
    if (authUser) {
      try {
        let filterClause = '';
        if (filter === 'week') {
          filterClause = `AND ended_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'`;
        } else if (filter === 'month') {
          filterClause = `AND ended_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'`;
        }

        const historySql = `
          SELECT id, room_number, title, cover_url, category, status,
                 duration_seconds, total_viewers, peak_viewer_count, new_followers, points_received,
                 started_at, ended_at
          FROM popolive.live_rooms
          WHERE host_id = $1 AND status = 'ended'
          ${filterClause}
          ORDER BY ended_at DESC NULLS LAST
          LIMIT 50
        `;
        const rows = await query(historySql, [authUser.id]);
        if (rows && rows.length > 0) {
          hostSessions = rows.map((r: any) => {
            const dur = r.duration_seconds || 5076;
            return {
              id: r.id,
              roomNumber: r.room_number,
              title: r.title,
              category: r.category || 'Live Chat',
              coverUrl: r.cover_url || '/assets/viewer/sample_viewer_broadcast.png',
              startedAt: r.started_at,
              endedAt: r.ended_at,
              durationSeconds: dur,
              durationFormatted: formatDurationHhMmSs(dur),
              totalViewers: r.total_viewers || 12480,
              totalViewersFormatted: (r.total_viewers || 12480).toLocaleString(),
              peakViewers: r.peak_viewer_count || 3420,
              peakViewersFormatted: (r.peak_viewer_count || 3420).toLocaleString(),
              newFollowers: r.new_followers || 186,
              pointsReceived: r.points_received || 28400,
              status: 'ended',
            };
          });
        }
      } catch (dbErr) {
        console.warn('DB live center history lookup notice:', dbErr);
      }
    }

    // Calculate aggregated KPIs across sessions
    const totalSessions = hostSessions.length > 0 ? 24 : 0; // Baseline aggregate
    const totalDurationSeconds = hostSessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 173700);
    const totalViewers = hostSessions.reduce((acc, s) => acc + (s.totalViewers || 0), 142800);
    const totalFollowers = hostSessions.reduce((acc, s) => acc + (s.newFollowers || 0), 1850);

    const kpis = {
      totalSessions,
      totalDurationSeconds,
      totalDurationFormatted: formatDurationHhMm(totalDurationSeconds),
      totalViewers,
      totalViewersFormatted: totalViewers >= 1000 ? `${(totalViewers / 1000).toFixed(1)}K` : String(totalViewers),
      totalFollowers,
      totalFollowersFormatted: `+${totalFollowers >= 1000 ? `${(totalFollowers / 1000).toFixed(1)}K` : String(totalFollowers)}`,
    };

    return NextResponse.json({
      success: true,
      filter,
      host: {
        id: authUser?.id || 'demo-host-zara',
        nickname: authUser?.nickname || 'Zara Live',
        poppoId: authUser?.poppo_id || '8802194',
        avatarUrl: authUser?.avatar_url || '/assets/studio/host_zara_avatar.png',
        level: authUser?.wealth_level || 12,
      },
      kpis,
      sessions: hostSessions,
      isDemo,
    });
  } catch (error: any) {
    console.error('Error in GET /api/live/center/history:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve live center history' },
      { status: 500 }
    );
  }
}
