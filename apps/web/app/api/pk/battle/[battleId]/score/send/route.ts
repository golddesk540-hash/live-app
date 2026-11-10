import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
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

    const body = await req.json();
    const {
      hostSide,
      targetHostId,
      senderId,
      senderName,
      points,
      giftName = 'Diamond Star',
      idempotencyKey,
    } = body;

    // 1. Basic validation
    if (!hostSide || !['host_a', 'host_b'].includes(hostSide)) {
      return NextResponse.json(
        { success: false, error: 'Invalid hostSide. Must be host_a or host_b.' },
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

    // 2. Fetch active battle
    const battleRows = await query(
      `SELECT * FROM popolive.pk_battles WHERE id = $1`,
      [battleId]
    );

    const battle = battleRows[0];
    if (!battle) {
      return NextResponse.json(
        { success: false, error: 'Battle session not found.' },
        { status: 404 }
      );
    }

    // 3. Check battle status and timer
    const now = new Date();
    const expiresAt = battle.expires_at ? new Date(battle.expires_at) : new Date(now.getTime() + 300000);
    const diffMs = expiresAt.getTime() - now.getTime();
    const remainingSeconds = Math.max(0, Math.floor(diffMs / 1000));

    if (battle.status === 'time_expired' || remainingSeconds <= 0) {
      return NextResponse.json(
        { success: false, error: 'Battle time expired. Scores are locked.' },
        { status: 400 }
      );
    }

    if (['completed', 'cancelled'].includes(battle.status)) {
      return NextResponse.json(
        { success: false, error: `Cannot add points to a ${battle.status} battle.` },
        { status: 400 }
      );
    }

    // 4. Validate target host matches the designated side
    const expectedHostId = hostSide === 'host_a' ? battle.host_a_id : battle.host_b_id;
    if (targetHostId && targetHostId !== expectedHostId) {
      return NextResponse.json(
        { success: false, error: `targetHostId does not match the designated host on ${hostSide}.` },
        { status: 400 }
      );
    }

    // 5. Strict deduplication via idempotencyKey
    const existing = await query(
      `SELECT id FROM popolive.pk_score_events WHERE idempotency_key = $1`,
      [idempotencyKey]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Duplicate score event rejected. Idempotency key has already been processed.',
          isDuplicate: true,
          eventId: existing[0].id,
        },
        { status: 409 }
      );
    }

    // 6. Record score event
    const eventInsert = await query(
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

    // 7. Atomically increment battle score
    const updateQuery =
      hostSide === 'host_a'
        ? `UPDATE popolive.pk_battles 
           SET host_a_score = host_a_score + $1, last_synced_at = NOW() 
           WHERE id = $2 
           RETURNING host_a_score, host_b_score, leading_host_id`
        : `UPDATE popolive.pk_battles 
           SET host_b_score = host_b_score + $1, last_synced_at = NOW() 
           WHERE id = $2 
           RETURNING host_a_score, host_b_score, leading_host_id`;

    const updatedRows = await query(updateQuery, [numericPoints, battleId]);
    const updated = updatedRows[0];

    const newScoreA = parseInt(updated.host_a_score, 10);
    const newScoreB = parseInt(updated.host_b_score, 10);
    const { ratioA, ratioB } = calculatePKScoreRatios(newScoreA, newScoreB);

    let leadingSide: 'host_a' | 'host_b' | 'tie' = 'tie';
    let leadingHostId = null;
    if (newScoreA > newScoreB) {
      leadingSide = 'host_a';
      leadingHostId = battle.host_a_id;
    } else if (newScoreB > newScoreA) {
      leadingSide = 'host_b';
      leadingHostId = battle.host_b_id;
    }

    await query(
      `UPDATE popolive.pk_battles SET leading_host_id = $1 WHERE id = $2`,
      [leadingHostId, battleId]
    );

    return NextResponse.json({
      success: true,
      event: eventInsert[0],
      scoreA: newScoreA,
      scoreB: newScoreB,
      ratioA,
      ratioB,
      leadingSide,
      leadingHostId,
      remainingSeconds,
      formattedTime: formatPKTime(remainingSeconds),
    });
  } catch (err: any) {
    console.error('API /api/pk/battle/[battleId]/score/send error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error processing score event' },
      { status: 500 }
    );
  }
}
