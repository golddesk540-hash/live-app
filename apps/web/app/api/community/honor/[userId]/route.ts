import { NextRequest, NextResponse } from 'next/server';
import { getCommunityHonor } from '@/lib/communityApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/community/honor/:userId
 * Reads derived Honor Level bars (wealth, shining, honor) from P7-P8 data.
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

    const honor = await getCommunityHonor(userId);

    return NextResponse.json({
      success: true,
      userId,
      wealth: honor.wealth,
      shining: honor.shining,
      honor: honor.honor,
    });
  } catch (err: any) {
    console.error('GET /api/community/honor/[userId] error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve honor levels.' },
      { status: err.status || 500 }
    );
  }
}
