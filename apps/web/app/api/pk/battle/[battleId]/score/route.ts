import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { calculatePKScoreRatios, determinePKTimerState, formatPKTime } from '@/lib/pk';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pk/battle/[battleId]/score
 * Authoritative PK Battle Score & Contributions from PostgreSQL
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { battleId: string } }
) {
  try {
    const battleId = params.battleId;
    if (!battleId) {
      return NextResponse.json(
        { success: false, error: 'Battle ID is required.' },
        { status: 400 }
      );
    }

    const battleRows = await query<any>(
      `SELECT id, battle_type, status, host_a_id, host_b_id, host_a_nickname, host_b_nickname,
              host_a_avatar, host_b_avatar, host_a_room, host_b_room,
              host_a_score, host_b_score, leading_host_id, duration_seconds, remaining_seconds,
              expires_at, started_at, ended_at
       FROM popolive.pk_battles
       WHERE id = $1`,
      [battleId]
    );

    if (!battleRows || battleRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'PK Battle not found.' },
        { status: 404 }
      );
    }

    const battle = battleRows[0];
    const scoreA = parseInt(battle.host_a_score || '0', 10);
    const scoreB = parseInt(battle.host_b_score || '0', 10);
    const { ratioA, ratioB } = calculatePKScoreRatios(scoreA, scoreB);

    let leadingSide: 'host_a' | 'host_b' | 'tie' = 'tie';
    if (scoreA > scoreB) leadingSide = 'host_a';
    else if (scoreB > scoreA) leadingSide = 'host_b';

    // Fetch top contributions / recent score events
    const recentEvents = await query<any>(
      `SELECT id, battle_id as "battleId", host_side as "hostSide", target_host_id as "targetHostId",
              sender_id as "senderId", sender_name as "senderName", points, gift_name as "giftName",
              idempotency_key as "idempotencyKey", created_at as "createdAt"
       FROM popolive.pk_score_events
       WHERE battle_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [battleId]
    );

    return NextResponse.json({
      success: true,
      battleId: battle.id,
      battleType: battle.battle_type || '1v1',
      status: battle.status,
      hostA: {
        id: battle.host_a_id,
        nickname: battle.host_a_nickname,
        avatar: battle.host_a_avatar,
        score: scoreA,
      },
      hostB: {
        id: battle.host_b_id,
        nickname: battle.host_b_nickname,
        avatar: battle.host_b_avatar,
        score: scoreB,
      },
      leadingSide,
      leadingHostId: battle.leading_host_id,
      ratioA,
      ratioB,
      recentEvents,
    });
  } catch (err: any) {
    console.error('API /api/pk/battle/[battleId]/score GET error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error retrieving PK score' },
      { status: 500 }
    );
  }
}
