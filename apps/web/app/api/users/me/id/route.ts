import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      poppoId: user.poppo_id,
      nickname: user.nickname,
      avatarUrl: user.avatar_url,
      country: user.country,
      createdAt: user.created_at,
    });
  } catch (err: any) {
    console.error('Error in GET /api/users/me/id:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
