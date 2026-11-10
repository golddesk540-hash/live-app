import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

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

    const rows = await query(
      `SELECT b.*,
              la.stream_key as host_a_stream_key,
              lb.stream_key as host_b_stream_key
       FROM popolive.pk_battles b
       LEFT JOIN popolive.live_rooms la ON la.room_number = b.host_a_room
       LEFT JOIN popolive.live_rooms lb ON lb.room_number = b.host_b_room
       WHERE b.id = $1`,
      [battleId]
    );

    const battle = rows[0];
    if (!battle) {
      return NextResponse.json(
        { success: false, error: 'PK Battle session not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      battle: {
        id: battle.id,
        battleType: battle.battle_type,
        matchMethod: battle.match_method,
        status: battle.status,
        hostA: {
          id: battle.host_a_id,
          roomNumber: battle.host_a_room,
          nickname: battle.host_a_nickname,
          avatar: battle.host_a_avatar,
          streamKey: battle.host_a_stream_key,
        },
        hostB: {
          id: battle.host_b_id,
          roomNumber: battle.host_b_room,
          nickname: battle.host_b_nickname,
          avatar: battle.host_b_avatar,
          streamKey: battle.host_b_stream_key,
        },
        createdAt: battle.created_at,
        startedAt: battle.started_at,
        endedAt: battle.ended_at,
      },
    });
  } catch (err: any) {
    console.error('API /api/pk/battle/[battleId] error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve battle details' },
      { status: 500 }
    );
  }
}
