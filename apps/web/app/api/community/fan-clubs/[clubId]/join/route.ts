import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { joinFanClub } from '@/lib/communityApiService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/community/fan-clubs/:clubId/join
 * Joins a broadcaster fan club.
 * Enforces Age 18+ and one membership per user per club (unique constraint).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to join a fan club.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { clubId } = params;
    const result = await joinFanClub(user, clubId);

    return NextResponse.json({
      success: true,
      memberId: result.memberId,
      clubId: result.clubId,
      badgeLabel: result.badgeLabel,
      joinedAt: result.joinedAt,
      message: `Joined fan club successfully!`,
    });
  } catch (err: any) {
    if (err.code === 'AGE_RESTRICTION_18_PLUS') {
      return NextResponse.json(
        { success: false, error: err.message, code: 'AGE_RESTRICTION_18_PLUS' },
        { status: 403 }
      );
    }
    if (err.code === 'ALREADY_JOINED') {
      return NextResponse.json(
        { success: false, error: err.message, code: 'ALREADY_JOINED' },
        { status: 409 }
      );
    }

    console.error('POST /api/community/fan-clubs/[clubId]/join error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to join fan club.', code: err.code || 'JOIN_FAILED' },
      { status: err.status || 500 }
    );
  }
}
