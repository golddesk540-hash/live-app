import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { formatBoostTime, PKWinnerBoost } from '@/lib/pk';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const rows = await query(
      `SELECT * FROM popolive.pk_winner_boosts
       WHERE winner_user_id = $1 AND status = 'active' AND expires_at > NOW()
       ORDER BY expires_at DESC
       LIMIT 1`,
      [userId]
    );

    if (rows.length === 0) {
      return NextResponse.json({
        success: true,
        hasActiveBoost: false,
        message: 'No active boost currently running for this user.',
      });
    }

    const b = rows[0];
    const now = new Date();
    const expiresAt = new Date(b.expires_at);
    const remainingSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));

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
      status: 'active',
      durationMinutes: b.duration_minutes,
      remainingSeconds,
      formattedCountdown: formatBoostTime(remainingSeconds),
      activatedAt: new Date(b.activated_at).toISOString(),
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date(b.created_at).toISOString(),
      isExpired: false,
    };

    return NextResponse.json({
      success: true,
      hasActiveBoost: true,
      boost,
    });
  } catch (err: any) {
    console.error('API /api/pk/boost/user/[userId] error:', err);
    return NextResponse.json({ success: false, error: 'Failed to retrieve active boost' }, { status: 500 });
  }
}
