import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const authUser = await getAuthenticatedUser(req).catch(() => null);
    const hostId = searchParams.get('hostId') || authUser?.id || '';

    if (!hostId) {
      return NextResponse.json(
        {
          success: false,
          code: 'HOST_ID_REQUIRED',
          error: 'Host ID is required.',
          errorUr: 'میزبان کی شناخت درکار ہے۔',
        },
        { status: 400 }
      );
    }

    const rows = await query(
      `SELECT q.*, 
              EXTRACT(EPOCH FROM (NOW() - q.created_at)) as elapsed_seconds
       FROM popolive.pk_matchmaking_queue q
       WHERE q.host_id = $1 OR q.host_id IN (SELECT poppo_id FROM popolive.users WHERE id::text = $1)
       ORDER BY q.updated_at DESC
       LIMIT 1`,
      [hostId]
    );

    const queueItem = rows[0];

    if (!queueItem) {
      return NextResponse.json({
        success: true,
        status: 'idle',
        hostId,
        message: 'Not currently in matchmaking queue.',
      });
    }

    let status = queueItem.status;
    const elapsed = Math.floor(queueItem.elapsed_seconds || 0);

    // Timeout check: 45 seconds timeout
    if (status === 'searching' && elapsed > 45) {
      status = 'no_opponent_available';
      await query(
        `UPDATE popolive.pk_matchmaking_queue 
         SET status = 'timeout', updated_at = NOW() 
         WHERE id = $1`,
        [queueItem.id]
      );
    } else if (status === 'searching') {
      status = 'finding_opponent';
    } else if (status === 'matched') {
      status = 'match_accepted';
    } else if (status === 'cancelled') {
      status = 'match_cancelled';
    } else if (status === 'timeout') {
      status = 'no_opponent_available';
    }

    let opponent: any = null;
    let battle: any = null;

    if (queueItem.matched_battle_id) {
      const battleRows = await query(
        `SELECT * FROM popolive.pk_battles WHERE id = $1`,
        [queueItem.matched_battle_id]
      );
      battle = battleRows[0] || null;

      if (battle) {
        const isHostA = battle.host_a_id === hostId || battle.host_a_id === queueItem.host_id;
        opponent = {
          id: isHostA ? battle.host_b_id : battle.host_a_id,
          nickname: isHostA ? battle.host_b_nickname : battle.host_a_nickname,
          avatar: isHostA ? battle.host_b_avatar : battle.host_a_avatar,
          roomNumber: isHostA ? battle.host_b_room : battle.host_a_room,
        };
      }
    }

    return NextResponse.json({
      success: true,
      status,
      elapsedSeconds: elapsed,
      hostId: queueItem.host_id,
      roomNumber: queueItem.room_number,
      battleId: queueItem.matched_battle_id || null,
      opponent,
      battle: battle ? {
        id: battle.id,
        battleType: battle.battle_type,
        status: battle.status,
        createdAt: battle.created_at,
        startedAt: battle.started_at,
      } : null,
    });
  } catch (err: any) {
    console.error('API /api/pk/matchmaking/status error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to get matchmaking status' },
      { status: 500 }
    );
  }
}
