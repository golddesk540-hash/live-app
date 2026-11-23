import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { calculatePKScoreRatios, determinePKTimerState, formatPKTime } from '@/lib/pk';

export const dynamic = 'force-dynamic';

export async function POST(
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

    const body = await req.json().catch(() => ({}));
    const {
      hostSide,
      targetHostId,
      senderId,
      senderName,
      points,
      giftName = 'Diamond Star',
      idempotencyKey,
    } = body;

    // 1. Basic validation (1v1 restriction strictly enforced)
    if (!hostSide || !['host_a', 'host_b'].includes(hostSide)) {
      return NextResponse.json(
        { success: false, error: 'Invalid hostSide. Must be host_a or host_b in 1v1 battle.', code: 'INVALID_HOST_SIDE' },
        { status: 400 }
      );
    }

    const numericPoints = parseInt(points, 10);
    if (isNaN(numericPoints) || numericPoints <= 0) {
      return NextResponse.json(
        { success: false, error: 'Points must be a positive integer.' },
        { status: 400 }
      );
    }

    if (!senderId || !senderName) {
      return NextResponse.json(
        { success: false, error: 'Sender information (senderId and senderName) is required.' },
        { status: 400 }
      );
    }

    if (!idempotencyKey) {
      return NextResponse.json(
        { success: false, error: 'idempotencyKey is required to prevent duplicate score events.' },
        { status: 400 }
      );
    }

    // 2. Execute within an atomic transaction with row locking
    const result = await withTransaction(async (client) => {
      // 2a. Strict deduplication check
      const existing = await client.query(
        `SELECT id FROM popolive.pk_score_events WHERE idempotency_key = $1`,
        [idempotencyKey]
      );

      if (existing.rows.length > 0) {
        const err: any = new Error('Duplicate score event rejected. Idempotency key has already been processed.');
        err.code = 'DUPLICATE_SCORE_EVENT';
        err.status = 409;
        err.eventId = existing.rows[0].id;
        throw err;
      }

      // 2b. Fetch active battle with row lock
      const battleRows = await client.query(
        `SELECT * FROM popolive.pk_battles WHERE id = $1 FOR UPDATE`,
        [battleId]
      );

      const battle = battleRows.rows[0];
      if (!battle) {
        const err: any = new Error('Battle session not found.');
        err.code = 'BATTLE_NOT_FOUND';
        err.status = 404;
        throw err;
      }

      // 1v1 restriction enforcement
      if (battle.battle_type && battle.battle_type !== '1v1') {
        const err: any = new Error('Only 1v1 PK battles are supported. 4-host scoring is unsupported.');
        err.code = 'UNSUPPORTED_BATTLE_TYPE';
        err.status = 400;
        throw err;
      }

      // 2c. Check battle status and timer
      const now = new Date();
      const expiresAt = battle.expires_at ? new Date(battle.expires_at) : new Date(now.getTime() + 300000);
      const diffMs = expiresAt.getTime() - now.getTime();
      const remainingSeconds = Math.max(0, Math.floor(diffMs / 1000));

      if (battle.status === 'time_expired' || remainingSeconds <= 0) {
        const err: any = new Error('Battle time expired. Scores are locked.');
        err.code = 'BATTLE_TIME_EXPIRED';
        err.status = 400;
        throw err;
      }

      if (['completed', 'cancelled'].includes(battle.status)) {
        const err: any = new Error(`Cannot add points to a ${battle.status} battle.`);
        err.code = 'BATTLE_ALREADY_ENDED';
        err.status = 400;
        throw err;
      }

      // 2d. Validate target host matches the designated side
      const expectedHostId = hostSide === 'host_a' ? battle.host_a_id : battle.host_b_id;
      if (targetHostId && targetHostId !== expectedHostId) {
        const err: any = new Error(`targetHostId does not match the designated host on ${hostSide}.`);
        err.code = 'MISMATCHED_TARGET_HOST';
        err.status = 400;
        throw err;
      }

      // 2e. Record score event
      const eventInsert = await client.query(
        `INSERT INTO popolive.pk_score_events (
           battle_id, host_side, target_host_id, sender_id, sender_name, points, gift_name, idempotency_key
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          battleId,
          hostSide,
          expectedHostId,
          senderId,
          senderName,
          numericPoints,
          giftName,
          idempotencyKey,
        ]
      );

      // 2f. Atomically increment battle score & determine leader
      const prevA = parseInt(battle.host_a_score || '0', 10);
      const prevB = parseInt(battle.host_b_score || '0', 10);
      const newScoreA = hostSide === 'host_a' ? prevA + numericPoints : prevA;
      const newScoreB = hostSide === 'host_b' ? prevB + numericPoints : prevB;

      let leadingSide: 'host_a' | 'host_b' | 'tie' = 'tie';
      let leadingHostId = null;
      if (newScoreA > newScoreB) {
        leadingSide = 'host_a';
        leadingHostId = battle.host_a_id;
      } else if (newScoreB > newScoreA) {
        leadingSide = 'host_b';
        leadingHostId = battle.host_b_id;
      }

      await client.query(
        `UPDATE popolive.pk_battles 
         SET host_a_score = $1, host_b_score = $2, leading_host_id = $3, last_synced_at = NOW() 
         WHERE id = $4`,
        [newScoreA, newScoreB, leadingHostId, battleId]
      );

      const { ratioA, ratioB } = calculatePKScoreRatios(newScoreA, newScoreB);

      return {
        event: eventInsert.rows[0],
        scoreA: newScoreA,
        scoreB: newScoreB,
        ratioA,
        ratioB,
        leadingSide,
        leadingHostId,
        remainingSeconds,
        formattedTime: formatPKTime(remainingSeconds),
      };
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    if (err?.code === 'DUPLICATE_SCORE_EVENT') {
      return NextResponse.json(
        {
          success: false,
          error: err.message,
          isDuplicate: true,
          eventId: err.eventId,
        },
        { status: 409 }
      );
    }
    if (err?.status) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.status }
      );
    }
    console.error('API /api/pk/battle/[battleId]/score/send error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error processing score event' },
      { status: 500 }
    );
  }
}
