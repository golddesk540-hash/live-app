import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getFanClubDetail } from '@/lib/communityApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/community/fan-clubs/:clubId
 * Returns fan club header, host info, member count, level, badge.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    const { clubId } = params;

    const club = await getFanClubDetail(clubId, user?.id);
    if (!club) {
      return NextResponse.json(
        { success: false, error: `Fan club "${clubId}" not found.`, code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      fanClub: club,
      club,
    });
  } catch (err: any) {
    console.error('GET /api/community/fan-clubs/[clubId] error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve fan club details.' },
      { status: err.status || 500 }
    );
  }
}
