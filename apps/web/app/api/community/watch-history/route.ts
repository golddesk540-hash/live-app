import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getWatchHistory } from '@/lib/communityApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/community/watch-history
 * Returns user's watched rooms history with replay availability, paginated.
 * LOCKED RULE 9: Read-only from live_room_history.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to view watch history.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await getWatchHistory(user.id, page, limit);

    return NextResponse.json({
      success: true,
      userId: user.id,
      history: result.history,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err: any) {
    console.error('GET /api/community/watch-history error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve watch history.' },
      { status: err.status || 500 }
    );
  }
}
