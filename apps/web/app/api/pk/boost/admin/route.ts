import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { formatBoostTime } from '@/lib/pk';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status') || '';

    let sql = `
      SELECT b.*,
             r.winner_score,
             r.loser_score,
             r.winner_nickname as result_winner_name
      FROM popolive.pk_winner_boosts b
      LEFT JOIN popolive.pk_battle_results r ON r.battle_id = b.battle_id
    `;
    const params: any[] = [];

    if (statusFilter) {
      sql += ` WHERE b.status = $1`;
      params.push(statusFilter);
    }

    sql += ` ORDER BY b.created_at DESC LIMIT 50`;

    const rows = await query(sql, params);
    const now = new Date();

    const boosts = rows.map((b: any) => {
      const expiresAt = new Date(b.expires_at);
      const remainingSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
      return {
        id: b.id,
        battleId: b.battle_id,
        winnerUserId: b.winner_user_id,
        winnerNickname: b.winner_nickname,
        boostType: b.boost_type,
        boostTitle: b.boost_title,
        status: remainingSeconds <= 0 && b.status === 'active' ? 'expired' : b.status,
        remainingSeconds,
        formattedCountdown: formatBoostTime(remainingSeconds),
        activatedAt: b.activated_at,
        expiresAt: b.expires_at,
      };
    });

    return NextResponse.json({
      success: true,
      totalCount: boosts.length,
      boosts,
    });
  } catch (err: any) {
    console.error('API /api/pk/boost/admin GET error:', err);
    return NextResponse.json({ success: false, error: 'Failed to list admin boosts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, boostId, adminId = 'admin_super_01', reason = 'Admin control override' } = body;

    if (!boostId) {
      return NextResponse.json({ success: false, error: 'boostId is required' }, { status: 400 });
    }

    const rows = await query(`SELECT * FROM popolive.pk_winner_boosts WHERE id = $1`, [boostId]);
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Boost record not found' }, { status: 404 });
    }

    const b = rows[0];
    const prevStatus = b.status;

    if (action === 'cancel') {
      await query(
        `UPDATE popolive.pk_winner_boosts SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
        [boostId]
      );
      await query(
        `UPDATE popolive.users SET has_active_boost = false, active_boost_id = NULL WHERE id = $1`,
        [b.winner_user_id]
      );
      await query(
        `INSERT INTO popolive.pk_boost_audit_logs (boost_id, battle_id, action, actor_id, actor_role, previous_status, new_status, reason)
         VALUES ($1, $2, 'cancelled', $3, 'admin', $4, 'cancelled', $5)`,
        [boostId, b.battle_id, adminId, prevStatus, reason]
      );

      return NextResponse.json({
        success: true,
        action: 'cancel',
        boostId,
        newStatus: 'cancelled',
        message: 'Boost cancelled successfully by administrator.',
      });
    } else if (action === 'activate') {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (b.duration_minutes || 30) * 60 * 1000);

      await query(
        `UPDATE popolive.pk_winner_boosts 
         SET status = 'active', activated_at = $1, expires_at = $2, updated_at = NOW() 
         WHERE id = $3`,
        [now, expiresAt, boostId]
      );
      await query(
        `UPDATE popolive.users SET has_active_boost = true, active_boost_id = $1 WHERE id = $2`,
        [boostId, b.winner_user_id]
      );
      await query(
        `INSERT INTO popolive.pk_boost_audit_logs (boost_id, battle_id, action, actor_id, actor_role, previous_status, new_status, reason)
         VALUES ($1, $2, 'activated', $3, 'admin', $4, 'active', $5)`,
        [boostId, b.battle_id, adminId, prevStatus, reason]
      );

      return NextResponse.json({
        success: true,
        action: 'activate',
        boostId,
        newStatus: 'active',
        expiresAt,
        message: 'Boost activated successfully by administrator.',
      });
    } else {
      return NextResponse.json({ success: false, error: `Invalid action: ${action}` }, { status: 400 });
    }
  } catch (err: any) {
    console.error('API /api/pk/boost/admin POST error:', err);
    return NextResponse.json({ success: false, error: 'Admin action failed' }, { status: 500 });
  }
}
