import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/live/pk/accept
 * Accept a 1v1 PK battle invitation.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { pkId } = body;

    if (!pkId) {
      return NextResponse.json({ success: false, error: 'PK battle ID is required.' }, { status: 400 });
    }

    const battleRows = await query<any>(
      `SELECT id, host_a_id, host_b_id, status FROM popolive.pk_battles WHERE id = $1 LIMIT 1`,
      [pkId]
    );

    if (battleRows.length === 0) {
      return NextResponse.json({ success: false, error: 'PK battle not found.' }, { status: 404 });
    }

    const battle = battleRows[0];
    if (battle.host_b_id !== user.id && battle.host_a_id !== user.id) {
      return NextResponse.json({ success: false, error: 'You are not a participant in this PK battle.', code: 'FORBIDDEN' }, { status: 403 });
    }

    await query(
      `UPDATE popolive.pk_battles
       SET status = 'active', started_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [battle.id]
    );

    return NextResponse.json({
      success: true,
      message: '1v1 PK battle accepted and started.',
      pkId: battle.id,
      status: 'active',
    });
  } catch (err: any) {
    console.error('POST /api/live/pk/accept error:', err);
    return NextResponse.json({ success: false, error: 'Failed to accept PK battle.' }, { status: 500 });
  }
}
