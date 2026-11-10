import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { formatBoostTime, PKWinnerBoost } from '@/lib/pk';

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

    // 1. Fetch boost record
    const rows = await query(
      `SELECT * FROM popolive.pk_winner_boosts WHERE battle_id = $1`,
      [battleId]
    );

    if (rows.length === 0) {
      return NextResponse.json({
        success: true,
        hasBoost: false,
        message: 'No winner boost found for this battle.',
      });
    }

    const b = rows[0];
    const now = new Date();
    const expiresAt = new Date(b.expires_at);
    const diffMs = expiresAt.getTime() - now.getTime();
    const remainingSeconds = Math.max(0, Math.floor(diffMs / 1000));
    let status = b.status;

    // Check automatic expiry
    if (remainingSeconds <= 0 && status === 'active') {
      status = 'expired';
      await query(
        `UPDATE popolive.pk_winner_boosts SET status = 'expired', updated_at = NOW() WHERE id = $1`,
        [b.id]
      );
      await query(
        `UPDATE popolive.users SET has_active_boost = false, active_boost_id = NULL WHERE id = $1`,
        [b.winner_user_id]
      );
      await query(
        `INSERT INTO popolive.pk_boost_audit_logs (boost_id, battle_id, action, actor_id, actor_role, previous_status, new_status, reason)
         VALUES ($1, $2, 'expired', 'system', 'system', 'active', 'expired', 'Automatic boost timer expiry')`,
        [b.id, battleId]
      );
    }

    const boost: PKWinnerBoost = {
      id: b.id,
      battleId: b.battle_id,
      resultId: b.result_id,
      winnerUserId: b.winner_user_id,
      winnerNickname: b.winner_nickname,
      winnerAvatar: b.winner_avatar,
      boostType: b.boost_type,
      boostTitle: b.boost_title,
      boostDescription: b.boost_description,
      multiplierPercentage: b.multiplier_percentage,
      status: status,
      durationMinutes: b.duration_minutes,
      remainingSeconds,
      formattedCountdown: formatBoostTime(remainingSeconds),
      activatedAt: new Date(b.activated_at).toISOString(),
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date(b.created_at).toISOString(),
      isExpired: remainingSeconds <= 0 || status === 'expired',
    };

    return NextResponse.json({
      success: true,
      hasBoost: true,
      boost,
    });
  } catch (err: any) {
    console.error('API /api/pk/boost/[battleId] GET error:', err);
    return NextResponse.json({ success: false, error: 'Failed to retrieve boost state' }, { status: 500 });
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
    const { durationMinutes = 30, boostType = 'points_boost' } = body;

    // 1. Check if boost already exists (prevent duplicate activation)
    const existing = await query(
      `SELECT * FROM popolive.pk_winner_boosts WHERE battle_id = $1`,
      [battleId]
    );

    if (existing.length > 0) {
      const b = existing[0];
      const now = new Date();
      const expiresAt = new Date(b.expires_at);
      const remainingSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
      return NextResponse.json({
        success: true,
        isDuplicate: true,
        message: 'Winner boost already exists for this battle.',
        boost: {
          id: b.id,
          battleId: b.battle_id,
          winnerUserId: b.winner_user_id,
          winnerNickname: b.winner_nickname,
          status: b.status,
          remainingSeconds,
          formattedCountdown: formatBoostTime(remainingSeconds),
        },
      });
    }

    // 2. Verify battle and official result
    const resultRows = await query(
      `SELECT * FROM popolive.pk_battle_results WHERE battle_id = $1`,
      [battleId]
    );

    if (resultRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No verified battle result found. Cannot activate boost for unverified battle.' },
        { status: 400 }
      );
    }

    const result = resultRows[0];
    if (result.result_type === 'draw' || !result.winner_host_id) {
      return NextResponse.json(
        { success: false, error: 'Battle ended in a draw. Winner boosts are not awarded for draws.' },
        { status: 400 }
      );
    }

    // 3. Create approved boost
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

    const boostInsert = await query(
      `INSERT INTO popolive.pk_winner_boosts (
         battle_id, result_id, winner_user_id, winner_nickname, winner_avatar,
         boost_type, boost_title, boost_description, multiplier_percentage,
         status, duration_minutes, activated_at, expires_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        battleId,
        result.id,
        result.winner_host_id,
        result.winner_nickname || 'Sara Live',
        result.winner_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
        boostType,
        'Winner Boost Active',
        `+20% points for next ${durationMinutes} minutes`,
        20,
        'active',
        durationMinutes,
        now,
        expiresAt,
      ]
    );

    const newBoost = boostInsert[0];

    // Audit log
    await query(
      `INSERT INTO popolive.pk_boost_audit_logs (boost_id, battle_id, action, actor_id, actor_role, previous_status, new_status, reason)
       VALUES ($1, $2, 'activated', 'system', 'system', 'pending', 'active', 'Winner boost activated after verified victory')`,
      [newBoost.id, battleId]
    );

    // Update user profile flag
    await query(
      `UPDATE popolive.users SET has_active_boost = true, active_boost_id = $1 WHERE id = $2`,
      [newBoost.id, result.winner_host_id]
    );

    const remainingSeconds = durationMinutes * 60;
    return NextResponse.json({
      success: true,
      boost: {
        id: newBoost.id,
        battleId: newBoost.battle_id,
        resultId: newBoost.result_id,
        winnerUserId: newBoost.winner_user_id,
        winnerNickname: newBoost.winner_nickname,
        winnerAvatar: newBoost.winner_avatar,
        boostType: newBoost.boost_type,
        boostTitle: newBoost.boost_title,
        boostDescription: newBoost.boost_description,
        multiplierPercentage: newBoost.multiplier_percentage,
        status: newBoost.status,
        durationMinutes: newBoost.duration_minutes,
        remainingSeconds,
        formattedCountdown: formatBoostTime(remainingSeconds),
        activatedAt: newBoost.activated_at,
        expiresAt: newBoost.expires_at,
        isExpired: false,
      },
    });
  } catch (err: any) {
    console.error('API /api/pk/boost/[battleId] POST error:', err);
    return NextResponse.json({ success: false, error: 'Failed to activate winner boost' }, { status: 500 });
  }
}
