import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/live/pk/invite
 * Initiate a 1v1 PK battle challenge to another broadcaster.
 * STRICT ENFORCEMENT:
 * - PK is strictly 1v1 only (Locked Rule 5)
 * - Multi-host and 4-host PK are rejected with HTTP 400 (Locked Rule 6)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required for PK.', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { targetHostId, targetRoomId, hosts, battleMode = '1v1', durationSeconds = 300 } = body;

    // RULE 5 & 6 ENFORCEMENT: Strictly 1v1 PK only
    if (Array.isArray(hosts) && hosts.length > 2) {
      return NextResponse.json({
        success: false,
        error: 'Multi-host PK is strictly disallowed. Popo Live supports 1v1 PK battles only.',
        code: 'MULTI_HOST_PK_DISALLOWED',
      }, { status: 400 });
    }

    if (battleMode && battleMode.toLowerCase() !== '1v1') {
      return NextResponse.json({
        success: false,
        error: `Battle mode '${battleMode}' is not supported. Only 1v1 PK battles are permitted.`,
        code: 'UNSUPPORTED_PK_MODE',
      }, { status: 400 });
    }

    if (!targetHostId && !targetRoomId) {
      return NextResponse.json({
        success: false,
        error: 'Target host or target room ID is required.',
        code: 'MISSING_TARGET',
      }, { status: 400 });
    }

    // Resolve inviter active room
    const myRoomRows = await query<any>(
      `SELECT id, room_number, title FROM popolive.live_rooms WHERE host_id = $1 AND is_live = true LIMIT 1`,
      [user.id]
    );

    const myRoomId = myRoomRows.length > 0 ? myRoomRows[0].id : `room_${user.id}`;
    const myRoomNumber = myRoomRows.length > 0 ? myRoomRows[0].room_number : '883901';

    // Resolve opponent host and room
    const targetRows = await query<any>(
      `SELECT u.id, u.nickname, u.avatar_url, lr.id AS room_id, lr.room_number
       FROM popolive.users u
       LEFT JOIN popolive.live_rooms lr ON lr.host_id = u.id AND lr.is_live = true
       WHERE u.id::text = $1 OR u.poppo_id = $1 OR lr.id::text = $2 OR lr.room_number = $2
       LIMIT 1`,
      [targetHostId || '', targetRoomId || '']
    );

    if (targetRows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Target host was not found or is offline.',
        code: 'TARGET_NOT_FOUND',
      }, { status: 404 });
    }

    const opponent = targetRows[0];

    if (opponent.id === user.id) {
      return NextResponse.json({
        success: false,
        error: 'You cannot invite yourself to a PK battle.',
        code: 'CANNOT_INVITE_SELF',
      }, { status: 400 });
    }

    const duration = Math.min(Math.max(Number(durationSeconds) || 300, 60), 600);

    // Create 1v1 PK battle record
    const pkRows = await query<any>(
      `INSERT INTO popolive.pk_battles (
        id, battle_type, host_a_id, host_a_room, host_a_nickname, host_a_avatar,
        host_b_id, host_b_room, host_b_nickname, host_b_avatar,
        status, host_a_score, host_b_score, duration_seconds, remaining_seconds,
        timer_status, created_at, started_at
      ) VALUES (
        gen_random_uuid(), '1v1', $1, $2, $3, $4,
        $5, $6, $7, $8,
        'active', 0, 0, $9, $9,
        'running', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING id, battle_type, host_a_id, host_a_nickname, host_b_id, host_b_nickname, status, duration_seconds, created_at`,
      [
        user.id,
        myRoomNumber,
        user.nickname,
        user.avatar_url || '/avatars/default.png',
        opponent.id,
        opponent.room_number || '883902',
        opponent.nickname,
        opponent.avatar_url || '/avatars/default.png',
        duration,
      ]
    );

    const pk = pkRows[0];

    // Mark rooms as in_pk
    await query(`UPDATE popolive.live_rooms SET is_pk = true, current_pk_id = $1 WHERE id = $2`, [pk.id, myRoomId]);
    if (opponent.room_id) {
      await query(`UPDATE popolive.live_rooms SET is_pk = true, current_pk_id = $1 WHERE id = $2`, [pk.id, opponent.room_id]);
    }

    return NextResponse.json({
      success: true,
      message: '1v1 PK battle invitation initiated and active.',
      pk: {
        id: pk.id,
        battleType: '1v1',
        hostA: { id: user.id, nickname: user.nickname, score: 0 },
        hostB: { id: opponent.id, nickname: opponent.nickname, score: 0 },
        durationSeconds: duration,
        status: 'active',
      },
    }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/live/pk/invite error:', err);
    return NextResponse.json({ success: false, error: 'Failed to initiate PK invite.' }, { status: 500 });
  }
}
