import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { calculatePKScoreRatios, determinePKTimerState, formatPKTime } from '@/lib/pk';

export const dynamic = 'force-dynamic';

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

    const battleRows = await query(
      `SELECT b.*,
              ua.country as host_a_country, ua.country_code as host_a_country_code, ua.poppo_id as host_a_poppo_id,
              ub.country as host_b_country, ub.country_code as host_b_country_code, ub.poppo_id as host_b_poppo_id,
              la.viewer_count as host_a_viewers,
              lb.viewer_count as host_b_viewers
       FROM popolive.pk_battles b
       LEFT JOIN popolive.users ua ON ua.id::text = b.host_a_id::text
       LEFT JOIN popolive.users ub ON ub.id::text = b.host_b_id::text
       LEFT JOIN popolive.live_rooms la ON la.room_number = b.host_a_room
       LEFT JOIN popolive.live_rooms lb ON lb.room_number = b.host_b_room
       WHERE b.id = $1`,
      [battleId]
    );

    const battle = battleRows[0];
    if (!battle) {
      return NextResponse.json(
        { success: false, error: 'PK Battle not found.' },
        { status: 404 }
      );
    }

    const now = new Date();
    const expiresAt = battle.expires_at ? new Date(battle.expires_at) : new Date(now.getTime() + 300000);
    const durationSeconds = battle.duration_seconds || 300;
    
    // Server-authoritative remaining time
    const diffMs = expiresAt.getTime() - now.getTime();
    const remainingSeconds = Math.max(0, Math.floor(diffMs / 1000));
    const elapsedSeconds = Math.max(0, durationSeconds - remainingSeconds);
    const timerStatus = determinePKTimerState(remainingSeconds);

    // If time has officially expired, update battle status
    if (remainingSeconds <= 0 && battle.status === 'active') {
      await query(
        `UPDATE popolive.pk_battles 
         SET status = 'time_expired', timer_status = 'time_expired', remaining_seconds = 0, last_synced_at = NOW() 
         WHERE id = $1`,
        [battleId]
      );
    }

    const scoreA = parseInt(battle.host_a_score || '0', 10);
    const scoreB = parseInt(battle.host_b_score || '0', 10);

    const { ratioA, ratioB } = calculatePKScoreRatios(scoreA, scoreB);

    let leadingSide: 'host_a' | 'host_b' | 'tie' = 'tie';
    if (scoreA > scoreB) leadingSide = 'host_a';
    else if (scoreB > scoreA) leadingSide = 'host_b';

    // Fetch recent score events
    const events = await query(
      `SELECT id, battle_id as "battleId", host_side as "hostSide", target_host_id as "targetHostId",
              sender_id as "senderId", sender_name as "senderName", points, gift_name as "giftName",
              idempotency_key as "idempotencyKey", created_at as "createdAt"
       FROM popolive.pk_score_events
       WHERE battle_id = $1
       ORDER BY created_at DESC
       LIMIT 15`,
      [battleId]
    );

    // Fetch recent comments
    const comments = await query(
      `SELECT id, battle_id as "battleId", user_id as "userId", user_name as "userName",
              user_avatar as "userAvatar", content, created_at as "createdAt"
       FROM popolive.pk_comments
       WHERE battle_id = $1
       ORDER BY created_at ASC
       LIMIT 30`,
      [battleId]
    );

    const responseData = {
      success: true,
      battleId: battle.id,
      battleType: battle.battle_type || '1v1',
      status: remainingSeconds <= 0 ? 'time_expired' : battle.status,
      hostA: {
        id: battle.host_a_id,
        poppoId: battle.host_a_poppo_id || '88201',
        nickname: battle.host_a_nickname || 'Sara Live',
        avatarUrl: battle.host_a_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
        roomNumber: battle.host_a_room || '88201',
        score: scoreA,
        viewerCount: battle.host_a_viewers || 32500,
        country: battle.host_a_country || 'Pakistan',
        countryCode: battle.host_a_country_code || 'PK',
        flagEmoji: '🇵🇰',
      },
      hostB: {
        id: battle.host_b_id,
        poppoId: battle.host_b_poppo_id || '88202',
        nickname: battle.host_b_nickname || 'Ayesha',
        avatarUrl: battle.host_b_avatar || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
        roomNumber: battle.host_b_room || '88202',
        score: scoreB,
        viewerCount: battle.host_b_viewers || 28700,
        country: battle.host_b_country || 'Pakistan',
        countryCode: battle.host_b_country_code || 'PK',
        flagEmoji: '🇵🇰',
      },
      timer: {
        durationSeconds,
        remainingSeconds,
        elapsedSeconds,
        formattedTime: formatPKTime(remainingSeconds),
        status: timerStatus,
        serverTime: now.toISOString(),
        startedAt: battle.started_at || now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      },
      leadingSide,
      leadingHostId: leadingSide === 'host_a' ? battle.host_a_id : leadingSide === 'host_b' ? battle.host_b_id : null,
      ratioA,
      ratioB,
      recentEvents: events,
      recentComments: comments,
    };

    return NextResponse.json(responseData);
  } catch (err: any) {
    console.error('API /api/pk/battle/[battleId]/score-timer error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error fetching score and timer' },
      { status: 500 }
    );
  }
}
