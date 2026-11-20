import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getAchievementPosterPayload } from '@/lib/communityApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/community/poster/me
 * Returns achievement poster payload for card preview.
 * LOCKED RULE 8: Poster is preview-only — no image generation server-side; data payload only.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to view poster payload.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const payload = await getAchievementPosterPayload(user);

    return NextResponse.json({
      success: true,
      poster: payload,
      payload,
    });
  } catch (err: any) {
    console.error('GET /api/community/poster/me error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to generate poster payload.' },
      { status: err.status || 500 }
    );
  }
}
