import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in to view your tickets.' }, { status: 401 });
    }

    const tickets = await query(
      `SELECT t.id, t.ticket_number, t.category, t.subject, t.status, t.priority,
              t.created_at, t.updated_at,
              COUNT(r.id)::int AS reply_count,
              MAX(r.created_at) AS last_reply_at
       FROM popolive.support_tickets t
       LEFT JOIN popolive.ticket_replies r ON t.id = r.ticket_id
       WHERE t.user_id = $1 OR t.email = $2 OR (t.poppo_id IS NOT NULL AND t.poppo_id = $3)
       GROUP BY t.id
       ORDER BY t.updated_at DESC, t.created_at DESC`,
      [user.id, user.email || '', user.poppo_id || '']
    );

    return NextResponse.json({
      success: true,
      tickets,
      totalCount: tickets.length,
    });
  } catch (err: any) {
    console.error('Error in GET /api/help/tickets/me:', err);
    return NextResponse.json({ error: 'Failed to retrieve your tickets.' }, { status: 500 });
  }
}
