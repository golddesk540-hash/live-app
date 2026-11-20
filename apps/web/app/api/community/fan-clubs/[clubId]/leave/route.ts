import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { leaveFanClub } from '@/lib/communityApiService';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/community/fan-clubs/:clubId/leave
 * Leaves a broadcaster fan club.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to leave a fan club.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { clubId } = params;
    const result = await leaveFanClub(user, clubId);

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (err: any) {
    console.error('DELETE /api/community/fan-clubs/[clubId]/leave error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to leave fan club.', code: err.code || 'LEAVE_FAILED' },
      { status: err.status || 500 }
    );
  }
}

/**
 * POST /api/community/fan-clubs/:clubId/leave
 * Convenience alias for clients that do not support DELETE with body.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { clubId: string } }
) {
  return DELETE(req, { params });
}
