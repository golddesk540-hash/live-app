import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getBagItems } from '@/lib/storeApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bag
 * Returns owned items in the authenticated user's bag.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to access bag.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const items = await getBagItems(user.id);

    return NextResponse.json({
      success: true,
      userId: user.id,
      items,
      count: items.length,
    });
  } catch (err: any) {
    console.error('GET /api/bag error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve bag items.' },
      { status: err.status || 500 }
    );
  }
}
