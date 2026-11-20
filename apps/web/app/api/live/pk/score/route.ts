import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/live/pk/score
 * Update 1v1 battle scores for a participating host side.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { pkId, hostSide, points = 10 } = body;

    if (!pkId) {
      return NextResponse.json({ success: false, error: 'PK battle ID is required.' }, { status: 400 });
    }

    const side = (hostSide || 'A').toUpperCase();
    if (side !== 'A' && side !== 'B') {
      return NextResponse.json({ success: false, error: 'hostSide must be either A or B.' }, { status: 400 });
    }

    const addScore = Math.max(1, Number(points) || 10);

    const updateSql = side === 'A'
      ? `UPDATE popolive.pk_battles
         SET host_a_score = host_a_score + $1,
             leading_host_id = CASE WHEN (host_a_score + $1) >= host_b_score THEN host_a_id ELSE host_b_id END
         WHERE id = $2
         RETURNING id, host_a_score, host_b_score, leading_host_id, status`
      : `UPDATE popolive.pk_battles
         SET host_b_score = host_b_score + $1,
             leading_host_id = CASE WHEN (host_b_score + $1) >= host_a_score THEN host_b_id ELSE host_a_id END
         WHERE id = $2
         RETURNING id, host_a_score, host_b_score, leading_host_id, status`;

    const updated = await query<any>(updateSql, [addScore, pkId]);

    if (updated.length === 0) {
      return NextResponse.json({ success: false, error: 'PK battle not found.' }, { status: 404 });
    }

    const battle = updated[0];

    return NextResponse.json({
      success: true,
      pkId: battle.id,
      hostAScore: Number(battle.host_a_score),
      hostBScore: Number(battle.host_b_score),
      leadingHostId: battle.leading_host_id,
      status: battle.status,
    });
  } catch (err: any) {
    console.error('POST /api/live/pk/score error:', err);
    return NextResponse.json({ success: false, error: 'Failed to update PK score.' }, { status: 500 });
  }
}
