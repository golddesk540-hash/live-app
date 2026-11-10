import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { redisDel } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const authUser = await getAuthenticatedUser(req).catch(() => null);

    const hostId = authUser?.id || body.hostId;

    if (!hostId) {
      return NextResponse.json(
        {
          success: false,
          code: 'HOST_ID_REQUIRED',
          error: 'Host ID is required to cancel matchmaking.',
          errorUr: 'میچ میکنگ منسوخ کرنے کے لیے میزبان کی شناخت درکار ہے۔',
        },
        { status: 400 }
      );
    }

    await query(
      `UPDATE popolive.pk_matchmaking_queue 
       SET status = 'cancelled', updated_at = NOW() 
       WHERE (host_id = $1 OR host_id IN (SELECT poppo_id FROM popolive.users WHERE id::text = $1))
         AND status = 'searching'`,
      [hostId]
    );

    await redisDel(`pk:matchmaking:${hostId}`);

    return NextResponse.json({
      success: true,
      status: 'match_cancelled',
      message: 'Matchmaking search cancelled.',
      messageUr: 'میچ میکنگ کی تلاش منسوخ کر دی گئی۔',
    });
  } catch (err: any) {
    console.error('API /api/pk/matchmaking/cancel error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel matchmaking' },
      { status: 500 }
    );
  }
}
