import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getUserFriends } from '@/lib/finalApiService';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const search = (searchParams.get('search') || '').trim();

    const viewer = await getAuthenticatedUser(req);
    const viewerId = viewer ? viewer.id : null;

    if (params.userId === 'me' && !viewerId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const result = await getUserFriends(params.userId, {
      page,
      limit,
      search,
      viewerId,
    });

    if (!result) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error in GET /api/users/[userId]/friends:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
