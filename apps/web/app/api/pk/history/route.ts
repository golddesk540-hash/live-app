import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { PKBattleHistoryItem } from '@/lib/pk';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hostId = searchParams.get('hostId') || '00000000-0000-0000-0000-000000088201'; // Default Sara Live

    const rows = await query(
      `SELECT * FROM popolive.pk_battle_results
       WHERE host_a_id = $1 OR host_b_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [hostId]
    );

    const history: PKBattleHistoryItem[] = rows.map((r: any) => {
      const isHostA = r.host_a_id === hostId;
      const myScore = parseInt(isHostA ? r.host_a_score : r.host_b_score, 10);
      const opponentScore = parseInt(isHostA ? r.host_b_score : r.host_a_score, 10);
      const opponentId = isHostA ? r.host_b_id : r.host_a_id;
      const opponentName = isHostA ? r.host_b_nickname : r.host_a_nickname;
      const opponentAvatar = isHostA ? r.host_b_avatar : r.host_a_avatar;

      let outcome: 'win' | 'loss' | 'draw' = 'draw';
      if (r.result_type === 'winner_declared') {
        outcome = r.winner_host_id === hostId ? 'win' : 'loss';
      }

      const durM = Math.floor((r.duration_seconds || 300) / 60);
      const durS = (r.duration_seconds || 300) % 60;
      const durationFormatted = `${durM}m ${durS > 0 ? `${durS}s` : ''}`.trim();

      return {
        battleId: r.battle_id,
        opponentId,
        opponentName,
        opponentAvatar,
        myScore,
        opponentScore,
        outcome,
        battleDate: r.ended_at ? new Date(r.ended_at).toLocaleDateString() : new Date().toLocaleDateString(),
        durationFormatted,
      };
    });

    return NextResponse.json({
      success: true,
      hostId,
      totalBattles: history.length,
      history,
    });
  } catch (err: any) {
    console.error('API /api/pk/history error:', err);
    return NextResponse.json({ success: false, error: 'Failed to retrieve battle history' }, { status: 500 });
  }
}
