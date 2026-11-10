import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isAdmin =
      searchParams.get('admin') === 'true' || req.headers.get('x-admin-role') === 'admin';

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Administrator privileges are required to view suspicious activity logs.',
        },
        { status: 403 }
      );
    }

    const battleId = searchParams.get('battleId');
    const userId = searchParams.get('userId');
    const severity = searchParams.get('severity');

    let sql = `
      SELECT id, user_id, battle_id, event_type, severity, reason, metadata, status, created_at
      FROM popolive.pk_security_events
      WHERE 1=1
    `;
    const params: any[] = [];

    if (battleId) {
      params.push(battleId);
      sql += ` AND battle_id = $${params.length}`;
    }

    if (userId) {
      params.push(userId);
      sql += ` AND user_id = $${params.length}`;
    }

    if (severity) {
      params.push(severity);
      sql += ` AND severity = $${params.length}`;
    }

    sql += ` ORDER BY created_at DESC LIMIT 50`;

    const events = await query<any>(sql, params);

    return NextResponse.json({
      success: true,
      events: events.map((e: any) => ({
        id: e.id,
        userId: e.user_id,
        battleId: e.battle_id,
        eventType: e.event_type,
        severity: e.severity,
        reason: e.reason,
        metadata: e.metadata,
        status: e.status,
        createdAt: e.created_at,
      })),
      count: events.length,
    });
  } catch (err: any) {
    console.error('API /api/pk/security/admin/suspicious-activity error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve suspicious activity logs' },
      { status: 500 }
    );
  }
}
