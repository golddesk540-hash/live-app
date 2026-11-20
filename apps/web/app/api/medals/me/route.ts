import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getMedalsMe } from '@/lib/vipApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/medals/me
 * PART 4 & Tests 20, 21:
 * Returns earned medals and locked slots for the authenticated user.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to view medals.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const medals = await getMedalsMe(user.id);
    const unlockedCount = medals.filter((m) => m.isUnlocked).length;
    const lockedCount = medals.length - unlockedCount;

    return NextResponse.json({
      success: true,
      userId: user.id,
      medals,
      unlockedCount,
      lockedCount,
      total: medals.length,
    });
  } catch (error: any) {
    console.error('GET /api/medals/me error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'FAILED_TO_FETCH_MEDALS' },
      { status: 500 }
    );
  }
}

/**
 * LOCKED RULE 7 & Test 22:
 * No grant endpoint exists. Medals are strictly read-only.
 */
export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Method Not Allowed: Medals cannot be manually granted. No grant endpoint exists.', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { success: false, error: 'Method Not Allowed: Medals cannot be manually granted. No grant endpoint exists.', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { success: false, error: 'Method Not Allowed: Medals cannot be manually modified.', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: 'Method Not Allowed: Medals cannot be manually deleted.', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  );
}
