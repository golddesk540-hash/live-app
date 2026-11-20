import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/live/pk/[pkId]
 * Retrieve 1v1 PK battle details and real-time scores.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { pkId: string } }
) {
  try {
    const pkId = params.pkId;
    const battleRows = await query<any>(
      `SELECT id, battle_type, host_a_id, host_a_nickname, host_a_avatar, host_a_score,
              host_b_id, host_b_nickname, host_b_avatar, host_b_score,
              status, duration_seconds, remaining_seconds, winner_host_id, result_type,
              created_at, started_at, ended_at
       FROM popolive.pk_battles
       WHERE id = $1
       LIMIT 1`,
      [pkId]
    );

    if (battleRows.length === 0) {
      return NextResponse.json({ success: false, error: 'PK battle not found.' }, { status: 404 });
    }

    const b = battleRows[0];

    return NextResponse.json({
      success: true,
      pk: {
        id: b.id,
        battleType: b.battle_type || '1v1',
        hostA: {
          id: b.host_a_id,
          nickname: b.host_a_nickname,
          avatar: b.host_a_avatar,
          score: Number(b.host_a_score) || 0,
        },
        hostB: {
          id: b.host_b_id,
          nickname: b.host_b_nickname,
          avatar: b.host_b_avatar,
          score: Number(b.host_b_score) || 0,
        },
        durationSeconds: Number(b.duration_seconds) || 300,
        remainingSeconds: Number(b.remaining_seconds) || 0,
        status: b.status,
        winnerHostId: b.winner_host_id,
        resultType: b.result_type,
        startedAt: b.started_at,
        endedAt: b.ended_at,
      },
    });
  } catch (err: any) {
    console.error(`GET /api/live/pk/${params.pkId} error:`, err);
    return NextResponse.json({ success: false, error: 'Failed to retrieve PK battle.' }, { status: 500 });
  }
}
