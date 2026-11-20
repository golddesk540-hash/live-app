import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/live/pk/result
 * Finalize a 1v1 PK battle and record final outcome.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { pkId } = body;

    if (!pkId) {
      return NextResponse.json({ success: false, error: 'PK battle ID is required.' }, { status: 400 });
    }

    const battleRows = await query<any>(
      `SELECT id, host_a_id, host_a_nickname, host_a_score,
              host_b_id, host_b_nickname, host_b_score,
              status
       FROM popolive.pk_battles
       WHERE id = $1
       LIMIT 1`,
      [pkId]
    );

    if (battleRows.length === 0) {
      return NextResponse.json({ success: false, error: 'PK battle not found.' }, { status: 404 });
    }

    const b = battleRows[0];
    const scoreA = Number(b.host_a_score) || 0;
    const scoreB = Number(b.host_b_score) || 0;

    let winnerId = null;
    let winnerNickname = null;
    let resultType = 'draw';

    if (scoreA > scoreB) {
      winnerId = b.host_a_id;
      winnerNickname = b.host_a_nickname;
      resultType = 'host_a_victory';
    } else if (scoreB > scoreA) {
      winnerId = b.host_b_id;
      winnerNickname = b.host_b_nickname;
      resultType = 'host_b_victory';
    }

    await query(
      `UPDATE popolive.pk_battles
       SET status = 'ended',
           ended_at = CURRENT_TIMESTAMP,
           winner_host_id = $2,
           result_type = $3
       WHERE id = $1`,
      [b.id, winnerId, resultType]
    );

    // Clear is_pk on active rooms
    await query(`UPDATE popolive.live_rooms SET is_pk = false WHERE current_pk_id = $1`, [b.id]);

    return NextResponse.json({
      success: true,
      pkId: b.id,
      status: 'ended',
      result: {
        scoreA,
        scoreB,
        winnerId,
        winnerNickname,
        resultType,
      },
    });
  } catch (err: any) {
    console.error('POST /api/live/pk/result error:', err);
    return NextResponse.json({ success: false, error: 'Failed to record PK result.' }, { status: 500 });
  }
}
