import { NextRequest, NextResponse } from 'next/server';
import { getActiveGuardians } from '@/lib/communityApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/community/guardians/:userId
 * Returns list of active guardians for the specified broadcaster / user.
 * Rejects expired records (enforces expires_at > NOW()).
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

    const guardians = await getActiveGuardians(userId);

    return NextResponse.json({
      success: true,
      hostId: userId,
      guardians,
      count: guardians.length,
    });
  } catch (err: any) {
    console.error('GET /api/community/guardians/[userId] error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve active guardians.' },
      { status: err.status || 500 }
    );
  }
}
