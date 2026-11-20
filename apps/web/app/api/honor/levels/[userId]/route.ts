import { NextRequest, NextResponse } from 'next/server';
import { getHonorLevels } from '@/lib/vipApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/honor/levels/:userId
 * PART 4 & Tests 17, 19:
 * Derived honor levels (wealth, shining, honor) from actual backend transactions & progress.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> | { userId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const userId = resolvedParams.userId;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required.', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    const levels = await getHonorLevels(userId);

    return NextResponse.json({
      success: true,
      ...levels,
    });
  } catch (error: any) {
    console.error('GET /api/honor/levels/:userId error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'FAILED_TO_FETCH_HONOR_LEVELS' },
      { status: 500 }
    );
  }
}

/**
 * LOCKED RULE 6 & Test 18:
 * No write endpoint exists for honor levels. They are strictly derived.
 */
export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Method Not Allowed: Honor levels are strictly derived and cannot be manually updated.', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { success: false, error: 'Method Not Allowed: Honor levels are strictly derived and cannot be manually updated.', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { success: false, error: 'Method Not Allowed: Honor levels are strictly derived and cannot be manually updated.', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: 'Method Not Allowed: Honor levels are strictly derived and cannot be manually deleted.', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  );
}
