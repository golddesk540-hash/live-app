import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { redisSetWithTtl } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const authUser = await getAuthenticatedUser(req).catch(() => null);

    const hostId = authUser?.id || body.hostId;
    const roomNumber = body.roomNumber || '7001';
    const battleType = body.battleType || '1v1';
    const language = (body.language || 'en').toLowerCase();
    const isUrdu = language === 'ur';

    if (!hostId) {
      return NextResponse.json(
        {
          success: false,
          code: 'HOST_ID_REQUIRED',
          error: 'Host ID is required to start matchmaking.',
          errorUr: 'میچ میکنگ شروع کرنے کے لیے میزبان کی شناخت درکار ہے۔',
        },
        { status: 400 }
      );
    }

    // 1. Host Eligibility Check
    const hostRows = await query(
      `SELECT u.id, u.poppo_id, u.nickname, u.avatar_url, u.country, u.country_code,
              u.status, u.is_face_verified, u.go_live_eligible,
              COALESCE(u.in_pk_battle, false) as in_pk_battle,
              lr.room_number, lr.status as room_status, lr.is_live,
              COALESCE(lr.viewer_count, 0) as viewer_count
       FROM popolive.users u
       LEFT JOIN popolive.live_rooms lr ON lr.host_id = u.id
       WHERE u.id::text = $1 OR u.poppo_id = $1
       LIMIT 1`,
      [hostId]
    );

    const host = hostRows[0];
    if (!host) {
      return NextResponse.json(
        {
          success: false,
          code: 'HOST_NOT_FOUND',
          error: 'Host account not found.',
          errorUr: 'میزبان کا اکاؤنٹ نہیں ملا۔',
        },
        { status: 404 }
      );
    }

    if (host.status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          code: 'HOST_SUSPENDED',
          error: 'Your account is suspended or ineligible for PK battles.',
          errorUr: 'آپ کا اکاؤنٹ معطل ہے یا پی کے مقابلے کے لیے اہل نہیں ہے۔',
        },
        { status: 403 }
      );
    }

    if (host.in_pk_battle) {
      return NextResponse.json(
        {
          success: false,
          code: 'HOST_ALREADY_IN_BATTLE',
          error: 'You are already in an active PK battle.',
          errorUr: 'آپ پہلے ہی ایک فعال پی کے مقابلے میں ہیں۔',
        },
        { status: 409 }
      );
    }

    const resolvedRoom = host.room_number || roomNumber;

    // 2. Atomic Match Search in Transaction
    const matchResult = await withTransaction(async (client) => {
      // Find an eligible opponent waiting in queue
      const opponentQueueRes = await client.query(
        `SELECT q.* 
         FROM popolive.pk_matchmaking_queue q
         JOIN popolive.users u ON u.id::text = q.host_id OR u.poppo_id = q.host_id
         WHERE q.status = 'searching' 
           AND q.host_id != $1
           AND q.battle_type = $2
           AND COALESCE(u.in_pk_battle, false) = false
           AND q.created_at > NOW() - INTERVAL '2 minutes'
         ORDER BY q.created_at ASC
         LIMIT 1
         FOR UPDATE SKIP LOCKED`,
        [host.id, battleType]
      );

      const opponent = opponentQueueRes.rows[0];

      if (opponent) {
        // Immediate Match Found! Create Confirmed PK Battle
        const battleRes = await client.query(
          `INSERT INTO popolive.pk_battles (
             battle_type, host_a_id, host_a_room, host_a_nickname, host_a_avatar,
             host_b_id, host_b_room, host_b_nickname, host_b_avatar,
             match_method, status, created_at, started_at
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'random', 'confirmed', NOW(), NOW())
           RETURNING *`,
          [
            battleType,
            opponent.host_id,
            opponent.room_number,
            opponent.host_nickname,
            opponent.host_avatar,
            host.id,
            resolvedRoom,
            host.nickname,
            host.avatar_url || '/avatars/default.png',
          ]
        );

        const battle = battleRes.rows[0];

        // Update opponent queue row
        await client.query(
          `UPDATE popolive.pk_matchmaking_queue 
           SET status = 'matched', matched_with_host_id = $1, matched_battle_id = $2, updated_at = NOW()
           WHERE id = $3`,
          [host.id, battle.id, opponent.id]
        );

        // Upsert current host queue row as matched
        await client.query(
          `INSERT INTO popolive.pk_matchmaking_queue (
             host_id, room_number, host_nickname, host_avatar, country_code,
             viewer_count, battle_type, status, matched_with_host_id, matched_battle_id, created_at, updated_at
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'matched', $8, $9, NOW(), NOW())
           ON CONFLICT (host_id) DO UPDATE SET
             room_number = EXCLUDED.room_number,
             host_nickname = EXCLUDED.host_nickname,
             status = 'matched',
             matched_with_host_id = EXCLUDED.matched_with_host_id,
             matched_battle_id = EXCLUDED.matched_battle_id,
             updated_at = NOW()`,
          [
            host.id,
            resolvedRoom,
            host.nickname,
            host.avatar_url || '/avatars/default.png',
            host.country_code || 'PK',
            host.viewer_count || 0,
            battleType,
            opponent.host_id,
            battle.id,
          ]
        );

        // Update users in_pk_battle
        await client.query(
          `UPDATE popolive.users 
           SET in_pk_battle = true, current_pk_battle_id = $1, updated_at = NOW()
           WHERE id::text IN ($2, $3) OR poppo_id IN ($2, $3)`,
          [battle.id, host.id, opponent.host_id]
        );

        // Update live_rooms in_pk_battle
        await client.query(
          `UPDATE popolive.live_rooms 
           SET in_pk_battle = true, is_pk = true, current_pk_id = $1, updated_at = NOW()
           WHERE room_number IN ($2, $3)`,
          [battle.id, resolvedRoom, opponent.room_number]
        );

        // Update pk_battle_sessions
        await client.query(
          `INSERT INTO popolive.pk_battle_sessions (
             room_number, host_id, battle_type, status, configured_at, updated_at
           )
           VALUES ($1, $2, $3, 'active', NOW(), NOW())
           ON CONFLICT (room_number) DO UPDATE SET
             battle_type = EXCLUDED.battle_type,
             status = 'active',
             updated_at = NOW()`,
          [resolvedRoom, host.id, battleType]
        );

        await client.query(
          `INSERT INTO popolive.pk_battle_sessions (
             room_number, host_id, battle_type, status, configured_at, updated_at
           )
           VALUES ($1, $2, $3, 'active', NOW(), NOW())
           ON CONFLICT (room_number) DO UPDATE SET
             battle_type = EXCLUDED.battle_type,
             status = 'active',
             updated_at = NOW()`,
          [opponent.room_number, opponent.host_id, battleType]
        );

        return {
          status: 'match_accepted',
          battle,
          opponent: {
            id: opponent.host_id,
            nickname: opponent.host_nickname,
            avatar: opponent.host_avatar,
            roomNumber: opponent.room_number,
            countryCode: opponent.country_code,
          },
        };
      } else {
        // No Opponent Waiting: Add to Queue as 'searching'
        await client.query(
          `INSERT INTO popolive.pk_matchmaking_queue (
             host_id, room_number, host_nickname, host_avatar, country_code,
             viewer_count, battle_type, status, created_at, updated_at
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'searching', NOW(), NOW())
           ON CONFLICT (host_id) DO UPDATE SET
             room_number = EXCLUDED.room_number,
             host_nickname = EXCLUDED.host_nickname,
             host_avatar = EXCLUDED.host_avatar,
             status = 'searching',
             matched_with_host_id = NULL,
             matched_battle_id = NULL,
             created_at = NOW(),
             updated_at = NOW()`,
          [
            host.id,
            resolvedRoom,
            host.nickname,
            host.avatar_url || '/avatars/default.png',
            host.country_code || 'PK',
            host.viewer_count || 0,
            battleType,
          ]
        );

        return {
          status: 'finding_opponent',
          battle: null,
          opponent: null,
        };
      }
    });

    // Cache matchmaking status in Redis
    await redisSetWithTtl(
      `pk:matchmaking:${host.id}`,
      JSON.stringify(matchResult),
      120
    );

    return NextResponse.json({
      success: true,
      status: matchResult.status,
      hostId: host.id,
      roomNumber: resolvedRoom,
      opponent: matchResult.opponent,
      battleId: matchResult.battle?.id || null,
      message:
        matchResult.status === 'match_accepted'
          ? 'Opponent found and match confirmed!'
          : 'Searching for an available live host...',
      messageUr:
        matchResult.status === 'match_accepted'
          ? 'مخالف مل گیا اور مقابلے کی تصدیق ہو گئی!'
          : 'دستیاب لائیو میزبان کی تلاش جاری ہے...',
    });
  } catch (err: any) {
    console.error('API /api/pk/matchmaking/start error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to start matchmaking' },
      { status: 500 }
    );
  }
}
