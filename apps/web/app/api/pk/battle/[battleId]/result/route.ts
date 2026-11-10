import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { calculatePKBattleWinner, PKBattleResult } from '@/lib/pk';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { battleId: string } }
) {
  try {
    const battleId = params.battleId;
    if (!battleId) {
      return NextResponse.json({ success: false, error: 'Battle ID is required.' }, { status: 400 });
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
      return NextResponse.json({
        success: true,
        isCalculated: true,
        result: mapResultRow(r),
      });
    }

    // 2. If not yet saved, check active battle
    const battleRows = await query(
      `SELECT * FROM popolive.pk_battles WHERE id = $1`,
      [battleId]
    );

    if (battleRows.length === 0) {
      return NextResponse.json({ success: false, error: 'PK Battle not found.' }, { status: 404 });
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

    // 3. Battle timer has reached zero or is time_expired -> Calculate & save once
    const calculatedResult = await calculateAndSaveResult(battle);
    return NextResponse.json({
      success: true,
      isCalculated: true,
      result: calculatedResult,
    });
  } catch (err: any) {
    console.error('API /api/pk/battle/[battleId]/result GET error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error retrieving result' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { battleId: string } }
) {
  try {
    const battleId = params.battleId;
    if (!battleId) {
      return NextResponse.json({ success: false, error: 'Battle ID is required.' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { action = 'end_battle', reason = 'timer_expired' } = body;

    // Check if result already exists
    const existing = await query(
      `SELECT * FROM popolive.pk_battle_results WHERE battle_id = $1`,
      [battleId]
    );

    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        isCalculated: true,
        isAlreadyFinalized: true,
        result: mapResultRow(existing[0]),
      });
    }

    const battleRows = await query(`SELECT * FROM popolive.pk_battles WHERE id = $1`, [battleId]);
    if (battleRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Battle not found' }, { status: 404 });
    }

    const battle = battleRows[0];
    const calculated = await calculateAndSaveResult(battle, reason);

    return NextResponse.json({
      success: true,
      isCalculated: true,
      result: calculated,
    });
  } catch (err: any) {
    console.error('API /api/pk/battle/[battleId]/result POST error:', err);
    return NextResponse.json({ success: false, error: 'Failed to finalize battle' }, { status: 500 });
  }
}

async function calculateAndSaveResult(battle: any, reason: string = 'timer_expired'): Promise<PKBattleResult> {
  const scoreA = parseInt(battle.host_a_score || '0', 10);
  const scoreB = parseInt(battle.host_b_score || '0', 10);

  const hostA = {
    id: battle.host_a_id,
    nickname: battle.host_a_nickname || 'Sara Live',
    avatarUrl: battle.host_a_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
  };

  const hostB = {
    id: battle.host_b_id,
    nickname: battle.host_b_nickname || 'Ayesha',
    avatarUrl: battle.host_b_avatar || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500',
  };

  const outcome = calculatePKBattleWinner(scoreA, scoreB, hostA, hostB);
  const durationSeconds = battle.duration_seconds || 300;
  const startedAt = battle.started_at || new Date().toISOString();
  const endedAt = new Date().toISOString();

  // Atomically insert into pk_battle_results
  const insertResult = await query(
    `INSERT INTO popolive.pk_battle_results (
       battle_id, battle_type,
       host_a_id, host_a_nickname, host_a_avatar, host_a_score,
       host_b_id, host_b_nickname, host_b_avatar, host_b_score,
       result_type, winner_host_id, winner_nickname, winner_avatar, winner_score,
       loser_host_id, loser_nickname, loser_avatar, loser_score,
       score_diff, duration_seconds, started_at, ended_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
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
       score_diff = EXCLUDED.score_diff
     RETURNING *`,
    [
      battle.id,
      battle.battle_type || '1v1',
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

  const savedResult = insertResult[0];

  // Update original pk_battles session
  await query(
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

  return mapResultRow(savedResult);
}

function mapResultRow(r: any): PKBattleResult {
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
