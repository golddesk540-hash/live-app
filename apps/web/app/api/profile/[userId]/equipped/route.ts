import { NextRequest, NextResponse } from 'next/server';
import { getEquippedProfileLoadout } from '@/lib/storeApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/profile/:userId/equipped
 * Returns equipped store items for profile display.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required.' },
        { status: 400 }
      );
    }

    const equipped = await getEquippedProfileLoadout(userId);

    return NextResponse.json({
      success: true,
      userId,
      equipped,
    });
  } catch (err: any) {
    console.error('GET /api/profile/[userId]/equipped error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve equipped profile loadout.' },
      { status: err.status || 500 }
    );
  }
}
