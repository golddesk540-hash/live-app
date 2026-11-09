import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { JoinPartyAudienceDto } from '@/lib/party';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;
    const body: JoinPartyAudienceDto = await req.json();

    const { userId, userName, userAvatar, userLevel } = body;

    if (!userId || !userName) {
      return NextResponse.json(
        { success: false, error: 'User ID and User Name are required to join audience.' },
        { status: 400 }
      );
    }

    const avatar = userAvatar || '/assets/studio/user_avatar_default.png';
    const level = userLevel || 1;

    // Module 5.9 & 5.10: Verify room limits and protection
    const roomRows = await query(
      `SELECT max_audience, is_locked, is_invite_only, status, active_rules_version FROM popolive.party_rooms WHERE room_number = $1`,
      [roomId]
    );

    if (roomRows && roomRows[0]) {
      const room = roomRows[0];
      if (room.status === 'closed') {
        return NextResponse.json(
          { success: false, error: 'Party room is closed.' },
          { status: 403 }
        );
      }
      if (room.is_locked) {
        return NextResponse.json(
          { success: false, error: 'Room is locked by host. New audience members cannot join.' },
          { status: 403 }
        );
      }

      // Module 5.10: Check Party Rules Acceptance
      const activeVersion = room.active_rules_version || 'v1.0';
      if ((body as any).acceptedRules) {
        await query(
          `INSERT INTO popolive.party_rule_acceptances (user_id, room_number, policy_version, is_accepted, accepted_at)
           VALUES ($1, $2, $3, TRUE, NOW())
           ON CONFLICT (user_id, room_number, policy_version) DO UPDATE SET is_accepted = TRUE, accepted_at = NOW()`,
          [userId, roomId, activeVersion]
        );
      } else if ((body as any).requireRulesCheck) {
        const accCheck = await query(
          `SELECT id FROM popolive.party_rule_acceptances 
           WHERE room_number = $1 AND user_id = $2 AND policy_version = $3 AND is_accepted = TRUE`,
          [roomId, userId, activeVersion]
        );
        if (!accCheck || accCheck.length === 0) {
          return NextResponse.json(
            {
              success: false,
              code: 'RULES_ACCEPTANCE_REQUIRED',
              error: 'You must accept the Party Rules before joining this room.',
              policyVersion: activeVersion,
            },
            { status: 403 }
          );
        }
      }

      // Check current audience count vs max_audience
      const countRes = await query(
        `SELECT COUNT(*) as count FROM popolive.party_audience WHERE room_number = $1 AND is_active = true`,
        [roomId]
      );
      const activeDbCount = parseInt(countRes[0]?.count || '0', 10);
      const limit = room.max_audience ?? 1000;
      if (activeDbCount >= limit) {
        return NextResponse.json(
          {
            success: false,
            error: `Room Full: Audience capacity of ${limit} has been reached. Please try again later.`,
            isRoomFull: true,
            limit,
          },
          { status: 429 }
        );
      }
    }

    // Upsert into party_audience
    const res = await query(
      `INSERT INTO popolive.party_audience (room_number, user_id, user_name, user_avatar, user_level, is_active, joined_at, last_heartbeat)
       VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
       ON CONFLICT (room_number, user_id) DO UPDATE SET
         user_name = EXCLUDED.user_name,
         user_avatar = EXCLUDED.user_avatar,
         user_level = EXCLUDED.user_level,
         is_active = true,
         last_heartbeat = NOW()
       RETURNING *`,
      [roomId, userId, userName, avatar, level]
    );

    // Get count
    const countRes = await query(
      `SELECT COUNT(*) as count FROM popolive.party_audience WHERE room_number = $1 AND is_active = true`,
      [roomId]
    );
    const activeDbCount = parseInt(countRes[0]?.count || '0', 10);
    const audienceCount = Math.max(roomId === '7001' ? 256 : 50, activeDbCount);

    return NextResponse.json({
      success: true,
      message: `${userName} joined party audience`,
      roomNumber: roomId,
      audienceCount,
      member: {
        userId: res[0].user_id,
        userName: res[0].user_name,
        userAvatar: res[0].user_avatar,
        userLevel: res[0].user_level,
        isActive: res[0].is_active,
      },
    });
  } catch (error: any) {
    console.error('API /party/[roomId]/audience/join error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to join party audience' },
      { status: 500 }
    );
  }
}
