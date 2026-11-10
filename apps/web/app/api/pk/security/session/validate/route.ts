import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { battleId, hostAId, hostBId } = body;

    if (!battleId) {
      return NextResponse.json(
        { success: false, error: 'Battle ID is required' },
        { status: 400 }
      );
    }

    const battleRows = await query<any>(
      `SELECT id, host_a_id, host_b_id, host_a_nickname, host_b_nickname, status, host_a_room, host_b_room
       FROM popolive.pk_battles
       WHERE id = $1`,
      [battleId]
    );

    if (!battleRows || battleRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'PK Battle not found' },
        { status: 404 }
      );
    }

    const battle = battleRows[0];

    // Check if candidate host has concurrency conflict (if explicitly provided in request)
    const checkHostA = hostAId;
    const checkHostB = hostBId;

    if (checkHostA) {
      const activeConflictsA = await query<any>(
        `SELECT id FROM popolive.pk_battles 
         WHERE (host_a_id = $1 OR host_b_id = $1) 
           AND status = 'active' 
           AND id != $2`,
        [checkHostA, battleId]
      );
      if (activeConflictsA.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Host ${battle.host_a_nickname || checkHostA} is already engaged in another active PK battle. Multi-battle concurrency is prohibited.`,
            code: 'HOST_CONCURRENT_BATTLE_CONFLICT',
          },
          { status: 409 }
        );
      }
    }

    if (checkHostB) {
      const activeConflictsB = await query<any>(
        `SELECT id FROM popolive.pk_battles 
         WHERE (host_a_id = $1 OR host_b_id = $1) 
           AND status = 'active' 
           AND id != $2`,
        [checkHostB, battleId]
      );
      if (activeConflictsB.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Host ${battle.host_b_nickname || checkHostB} is already engaged in another active PK battle. Multi-battle concurrency is prohibited.`,
            code: 'HOST_CONCURRENT_BATTLE_CONFLICT',
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      battleId,
      sessionValid: true,
      status: battle.status,
      roomNumber: battle.host_a_room || battle.host_b_room,
      hosts: {
        hostA: { id: battle.host_a_id, nickname: battle.host_a_nickname },
        hostB: { id: battle.host_b_id, nickname: battle.host_b_nickname },
      },
      message: 'Battle session validated successfully.',
    });
  } catch (err: any) {
    console.error('API /api/pk/security/session/validate error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to validate battle session' },
      { status: 500 }
    );
  }
}
