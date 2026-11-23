import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { calculatePKBattleWinner, PKBattleResult } from '@/lib/pk';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { battleId: string } }
) {
  try {
    const battleId = params.battleId;
    if (!battleId) {
      return NextResponse.json(
        { success: false, error: 'Battle ID is required.', code: 'MISSING_BATTLE_ID' },
        { status: 400 }
      );
    }

    // 1. Check if result already exists in pk_battle_results
    const existingResults = await query(
      `SELECT r.*,
              b.match_method,
              b.host_a_room,
              b.host_b_room
       FROM popolive.pk_battle_results r
       JOIN popolive.pk_battles b ON b.id = r.battle_id
       WHERE r.battle_id = $1`,
      [battleId]
    );

    if (existingResults.length > 0) {
      const r = existingResults[0];
      const giftTotals = await query<any>(
        `SELECT COALESCE(SUM(total_coins), 0) as "totalGiftCoins",
                COALESCE(SUM(pk_score_added), 0) as "totalPkScoreAdded",
                COUNT(*) as "totalGiftCount"
         FROM popolive.pk_gift_transactions
         WHERE battle_id = $1`,
        [battleId]
      );

      const mapped = mapResultRow(r);
      mapped.giftContributions = {
        totalCoins: parseInt(giftTotals[0]?.totalGiftCoins || '0', 10),
        totalScoreAdded: parseInt(giftTotals[0]?.totalPkScoreAdded || '0', 10),
        giftCount: parseInt(giftTotals[0]?.totalGiftCount || '0', 10),
      };

      return NextResponse.json({
        success: true,
        isCalculated: true,
        result: mapped,
      });
    }

    // 2. If not yet saved, check active battle
    const battleRows = await query<any>(
      `SELECT * FROM popolive.pk_battles WHERE id = $1`,
      [battleId]
    );

    if (battleRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'PK Battle not found.', code: 'BATTLE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const battle = battleRows[0];
    const now = new Date();
    const expiresAt = battle.expires_at ? new Date(battle.expires_at) : new Date(now.getTime() + 300000);
    const diffMs = expiresAt.getTime() - now.getTime();
    const remainingSeconds = Math.max(0, Math.floor(diffMs / 1000));

    // If still in progress and timer > 0, result is not yet available
    if (battle.status === 'active' && remainingSeconds > 0) {
      return NextResponse.json({
        success: true,
        isCalculated: false,
        message: 'PK battle is still active. Timer has not reached zero.',
        remainingSeconds,
      });
    }

    // 3. Battle timer has reached zero or is completed -> Calculate & save once
    const calculatedResult = await calculateAndSaveResult(battle);
    return NextResponse.json({
      success: true,
      isCalculated: true,
      result: calculatedResult,
    });
  } catch (err: any) {
    console.error('API /api/pk/battle/[battleId]/result GET error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error retrieving result', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { battleId: string } }
) {
  try {
    const battleId = params.battleId;
    if (!battleId) {
      return NextResponse.json(
        { success: false, error: 'Battle ID is required.', code: 'MISSING_BATTLE_ID' },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { action = 'end_battle', reason = 'timer_expired' } = body;

    // 1. Fetch battle to verify existence & 1v1 restriction
    const battleRows = await query<any>(
      `SELECT * FROM popolive.pk_battles WHERE id = $1`,
      [battleId]
    );

    if (battleRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'PK Battle session not found.', code: 'BATTLE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const battle = battleRows[0];

    // Strictly enforce 1v1 restriction
    if (battle.battle_type && battle.battle_type !== '1v1') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only 1v1 PK battles can be finalized. 4-host battles are unsupported.',
          code: 'UNSUPPORTED_BATTLE_TYPE',
        },
        { status: 400 }
      );
    }

    // 2. Authorize Caller (Host A, Host B, or Admin)
    const authUser = await getAuthenticatedUser(req);
    const callerId = authUser?.id || body.callerId || body.hostId || body.userId;

    if (callerId) {
      const isHostA = callerId === battle.host_a_id;
      const isHostB = callerId === battle.host_b_id;
      const isAdmin = authUser?.role === 'admin';

      if (!isHostA && !isHostB && !isAdmin) {
        return NextResponse.json(
          {
            success: false,
            error: 'Unauthorized: Only participating hosts or administrators can end this PK battle.',
            code: 'FORBIDDEN',
          },
          { status: 403 }
        );
      }
    }

    // 3. Check if result already exists in pk_battle_results (Idempotent replay)
    const existing = await query<any>(
      `SELECT * FROM popolive.pk_battle_results WHERE battle_id = $1`,
      [battleId]
    );

    if (existing.length > 0) {
      const giftTotals = await query<any>(
        `SELECT COALESCE(SUM(total_coins), 0) as "totalGiftCoins",
                COALESCE(SUM(pk_score_added), 0) as "totalPkScoreAdded",
                COUNT(*) as "totalGiftCount"
         FROM popolive.pk_gift_transactions
         WHERE battle_id = $1`,
        [battleId]
      );

      const mapped = mapResultRow(existing[0]);
      mapped.giftContributions = {
        totalCoins: parseInt(giftTotals[0]?.totalGiftCoins || '0', 10),
        totalScoreAdded: parseInt(giftTotals[0]?.totalPkScoreAdded || '0', 10),
        giftCount: parseInt(giftTotals[0]?.totalGiftCount || '0', 10),
      };

      return NextResponse.json({
        success: true,
        isCalculated: true,
        isAlreadyFinalized: true,
        result: mapped,
      });
    }

    // 4. Atomically finalize battle inside a single PostgreSQL transaction
    const calculated = await calculateAndSaveResult(battle, reason);

    return NextResponse.json({
      success: true,
      isCalculated: true,
      isAlreadyFinalized: false,
      result: calculated,
    });
  } catch (err: any) {
    console.error('API /api/pk/battle/[battleId]/result POST error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to finalize battle', code: err.code || 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

async function calculateAndSaveResult(battle: any, reason: string = 'timer_expired'): Promise<PKBattleResult> {
  return withTransaction(async (client) => {
    // Lock the battle row to prevent concurrent finalizations
    const bLock = await client.query(
      `SELECT * FROM popolive.pk_battles WHERE id = $1 FOR UPDATE`,
      [battle.id]
    );

    if (bLock.rows.length === 0) {
      const err: any = new Error('Battle not found during transaction lock');
      err.code = 'BATTLE_NOT_FOUND';
      throw err;
    }

    const currentBattle = bLock.rows[0];

    // Re-check if result was committed while waiting for row lock
    const existingResult = await client.query(
      `SELECT * FROM popolive.pk_battle_results WHERE battle_id = $1`,
      [battle.id]
    );

    if (existingResult.rows.length > 0) {
      return mapResultRow(existingResult.rows[0]);
    }

    // Read authoritative scores directly from PostgreSQL
    const scoreA = parseInt(currentBattle.host_a_score || '0', 10);
    const scoreB = parseInt(currentBattle.host_b_score || '0', 10);

    const hostA = {
      id: currentBattle.host_a_id,
      nickname: currentBattle.host_a_nickname || 'Sara Live',
      avatarUrl: currentBattle.host_a_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
    };

    const hostB = {
      id: currentBattle.host_b_id,
      nickname: currentBattle.host_b_nickname || 'Ayesha',
      avatarUrl: currentBattle.host_b_avatar || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500',
    };

    // Calculate winner & loser according to canonical Poppo Live rules
    const outcome = calculatePKBattleWinner(scoreA, scoreB, hostA, hostB);
    const durationSeconds = currentBattle.duration_seconds || 300;
    const startedAt = currentBattle.started_at || new Date().toISOString();
    const endedAt = new Date().toISOString();

    // Query gift contribution totals
    const giftTotals = await client.query(
      `SELECT COALESCE(SUM(total_coins), 0) as "totalGiftCoins",
              COALESCE(SUM(pk_score_added), 0) as "totalPkScoreAdded",
              COUNT(*) as "totalGiftCount"
       FROM popolive.pk_gift_transactions
       WHERE battle_id = $1`,
      [battle.id]
    );

    // Atomically insert into pk_battle_results
    const insertResult = await client.query(
      `INSERT INTO popolive.pk_battle_results (
         battle_id, battle_type,
         host_a_id, host_a_nickname, host_a_avatar, host_a_score,
         host_b_id, host_b_nickname, host_b_avatar, host_b_score,
         result_type, winner_host_id, winner_nickname, winner_avatar, winner_score,
         loser_host_id, loser_nickname, loser_avatar, loser_score,
         score_diff, duration_seconds, started_at, ended_at, created_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, NOW())
       ON CONFLICT (battle_id) DO UPDATE SET
         host_a_score = EXCLUDED.host_a_score,
         host_b_score = EXCLUDED.host_b_score,
         result_type = EXCLUDED.result_type,
         winner_host_id = EXCLUDED.winner_host_id,
         winner_nickname = EXCLUDED.winner_nickname,
         winner_score = EXCLUDED.winner_score,
         loser_host_id = EXCLUDED.loser_host_id,
         loser_nickname = EXCLUDED.loser_nickname,
         loser_score = EXCLUDED.loser_score,
         score_diff = EXCLUDED.score_diff,
         ended_at = EXCLUDED.ended_at
       RETURNING *`,
      [
        battle.id,
        currentBattle.battle_type || '1v1',
        hostA.id,
        hostA.nickname,
        hostA.avatarUrl,
        scoreA,
        hostB.id,
        hostB.nickname,
        hostB.avatarUrl,
        scoreB,
        outcome.resultType,
        outcome.winnerHostId,
        outcome.winnerNickname,
        outcome.winnerAvatar,
        outcome.winnerScore,
        outcome.loserHostId,
        outcome.loserNickname,
        outcome.loserAvatar,
        outcome.loserScore,
        outcome.scoreDiff,
        durationSeconds,
        startedAt,
        endedAt,
      ]
    );

    const savedResult = insertResult.rows[0];

    // Update pk_battles session
    await client.query(
      `UPDATE popolive.pk_battles 
       SET status = 'completed',
           timer_status = 'completed',
           remaining_seconds = 0,
           winner_host_id = $1,
           result_id = $2,
           result_type = $3,
           ended_at = $4
       WHERE id = $5`,
      [outcome.winnerHostId, savedResult.id, outcome.resultType, endedAt, battle.id]
    );

    // Release participating hosts and live rooms from PK battle state
    await client.query(
      `UPDATE popolive.users 
       SET in_pk_battle = false, current_pk_battle_id = NULL, updated_at = NOW() 
       WHERE id::text IN ($1, $2) OR poppo_id IN ($1, $2)`,
      [hostA.id, hostB.id]
    ).catch(() => {});

    await client.query(
      `UPDATE popolive.live_rooms 
       SET in_pk_battle = false, is_pk = false, current_pk_id = NULL, updated_at = NOW() 
       WHERE room_number IN ($1, $2) OR id::text IN ($1, $2)`,
      [currentBattle.host_a_room, currentBattle.host_b_room]
    ).catch(() => {});

    const mapped = mapResultRow(savedResult);
    mapped.giftContributions = {
      totalCoins: parseInt(giftTotals.rows[0]?.totalGiftCoins || '0', 10),
      totalScoreAdded: parseInt(giftTotals.rows[0]?.totalPkScoreAdded || '0', 10),
      giftCount: parseInt(giftTotals.rows[0]?.totalGiftCount || '0', 10),
    };

    return mapped;
  });
}

function mapResultRow(r: any): PKBattleResult & { giftContributions?: any } {
  return {
    id: r.id,
    battleId: r.battle_id,
    battleType: r.battle_type || '1v1',
    hostAId: r.host_a_id,
    hostANickname: r.host_a_nickname,
    hostAAvatar: r.host_a_avatar,
    hostAScore: parseInt(r.host_a_score || '0', 10),
    hostBId: r.host_b_id,
    hostBNickname: r.host_b_nickname,
    hostBAvatar: r.host_b_avatar,
    hostBScore: parseInt(r.host_b_score || '0', 10),
    resultType: r.result_type || 'winner_declared',
    winnerHostId: r.winner_host_id || null,
    winnerNickname: r.winner_nickname || null,
    winnerAvatar: r.winner_avatar || null,
    winnerScore: r.winner_score ? parseInt(r.winner_score, 10) : null,
    loserHostId: r.loser_host_id || null,
    loserNickname: r.loser_nickname || null,
    loserAvatar: r.loser_avatar || null,
    loserScore: r.loser_score ? parseInt(r.loser_score, 10) : null,
    scoreDiff: parseInt(r.score_diff || '0', 10),
    durationSeconds: r.duration_seconds || 300,
    startedAt: r.started_at ? new Date(r.started_at).toISOString() : new Date().toISOString(),
    endedAt: r.ended_at ? new Date(r.ended_at).toISOString() : new Date().toISOString(),
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
  };
}
