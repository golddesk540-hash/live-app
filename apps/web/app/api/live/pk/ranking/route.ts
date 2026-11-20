import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/live/pk/ranking
 * Read-only endpoint for PK ranking banner in Explore feed.
 */
export async function GET(req: NextRequest) {
  try {
    const battles = await query<any>(`
      SELECT id, host_a_nickname, host_a_avatar, host_b_nickname, host_b_avatar,
             host_a_score, host_b_score, status, duration_seconds, remaining_seconds,
             created_at
      FROM popolive.pk_battles
      ORDER BY (host_a_score + host_b_score) DESC, created_at DESC
      LIMIT 10
    `);

    const ranking = battles.map((b, idx) => ({
      rank: idx + 1,
      id: b.id,
      hostA: {
        nickname: b.host_a_nickname || 'Broadcaster A',
        avatar: b.host_a_avatar || '/avatars/default.png',
        score: Number(b.host_a_score) || 0,
      },
      hostB: {
        nickname: b.host_b_nickname || 'Broadcaster B',
        avatar: b.host_b_avatar || '/avatars/default.png',
        score: Number(b.host_b_score) || 0,
      },
      totalScore: (Number(b.host_a_score) || 0) + (Number(b.host_b_score) || 0),
      status: b.status || 'ended',
    }));

    return NextResponse.json({
      success: true,
      ranking,
      banner: ranking.length > 0 ? {
        title: 'PK Global Arena Ranking 🔥',
        subtitle: '1v1 Battle of Stars',
        topBattle: ranking[0],
      } : {
        title: 'PK Global Arena Ranking 🔥',
        subtitle: 'Top 1v1 Battle Arena',
        topBattle: null,
      },
    });
  } catch (err: any) {
    console.error('GET /api/live/pk/ranking error:', err);
    return NextResponse.json({ success: false, error: 'Failed to retrieve PK rankings.' }, { status: 500 });
  }
}
