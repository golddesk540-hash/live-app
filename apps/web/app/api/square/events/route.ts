import { NextRequest, NextResponse } from 'next/server';
import { resolveSquareActor } from '@/lib/squareCommunity';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await resolveSquareActor(req);
    const { searchParams } = new URL(req.url);
    const since = searchParams.get('since') || new Date(Date.now() - 3600000).toISOString();

    const sql = `
      SELECT id, event_type, target_user_id, payload, created_at
      FROM popolive.square_realtime_events
      WHERE created_at > $1
        AND (target_user_id IS NULL OR target_user_id = $2)
      ORDER BY created_at ASC
      LIMIT 100
    `;

    const events = await query(sql, [since, user?.id || null]);

    return NextResponse.json({
      success: true,
      events,
      count: events.length,
      serverTime: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching square events:', error);
    return NextResponse.json({ success: false, error: error.message || 'FAILED_TO_FETCH_EVENTS' }, { status: 500 });
  }
}
