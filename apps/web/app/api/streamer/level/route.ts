import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getStreamerLevel, assertAdult } from '@/lib/finalApiService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }
    assertAdult(user, 'view streamer level');

    const level = await getStreamerLevel(user.id);
    return NextResponse.json({
      success: true,
      ...level,
      level,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message, code: err.code || 'STREAMER_LEVEL_ERROR' },
      { status: err.status || 500 }
    );
  }
}
