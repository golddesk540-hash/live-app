import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const roomNumber = url.searchParams.get('roomNumber') || '7001';

    const sessionRows = await query(
      `SELECT s.id, s.room_number, s.host_id, s.battle_type, s.language, s.status, s.configured_at,
              t.name as battle_name, t.name_ur as battle_name_ur, t.is_locked
       FROM popolive.pk_battle_sessions s
       JOIN popolive.pk_battle_types t ON s.battle_type = t.id
       WHERE s.room_number = $1
       ORDER BY s.configured_at DESC
       LIMIT 1`,
      [roomNumber]
    );

    if (!sessionRows || sessionRows.length === 0) {
      return NextResponse.json({
        success: true,
        hasConfiguredSession: false,
        roomNumber,
        battleType: '1v1',
      });
    }

    const session = sessionRows[0];

    return NextResponse.json({
      success: true,
      hasConfiguredSession: true,
      sessionId: session.id,
      roomNumber: session.room_number,
      battleType: session.battle_type,
      battleName: session.battle_name,
      battleNameUr: session.battle_name_ur,
      status: session.status,
      language: session.language,
      configuredAt: session.configured_at,
    });
  } catch (error: any) {
    console.error('Error fetching PK battle session:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error fetching session' },
      { status: 500 }
    );
  }
}
