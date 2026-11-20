import { NextRequest, NextResponse } from 'next/server';
import { getCommunityLevel } from '@/lib/communityApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/community/level/:userId
 * Opens the Level view, directly reusing P7-P8 honor data.
 * LOCKED RULE 7: Strictly read-only — no write endpoints.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required.', code: 'USER_ID_REQUIRED' },
        { status: 400 }
      );
    }

    const honor = await getCommunityLevel(userId);

    return NextResponse.json({
      success: true,
      userId,
      wealth: honor.wealth,
      shining: honor.shining,
      honor: honor.honor,
    });
  } catch (err: any) {
    console.error('GET /api/community/level/[userId] error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve level data.' },
      { status: err.status || 500 }
    );
  }
}
