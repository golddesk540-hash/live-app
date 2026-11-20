import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getAchievementPosterPayload } from '@/lib/communityApiService';
import { storageService } from '@/lib/storageService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/community/poster/generate
 * Generates genuine PNG achievement poster from user stats, stores it in popo-posters bucket,
 * and returns the public CDN URL.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to generate poster.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // 1. Get user achievement payload
    const payload = await getAchievementPosterPayload(user);

    // 2. Generate and store PNG poster
    const posterData = {
      userId: user.id,
      nickname: user.nickname || 'User',
      poppoId: user.poppo_id || user.id.slice(0, 8),
      wealthLevel: payload.honorSummary?.wealthLevel || 1,
      hostLevel: payload.honorSummary?.honorLevel || 1,
      medalsCount: payload.highlightMedals?.length || 0,
      badgeLabel: payload.honorSummary?.honorName || 'Rising Star',
    };

    const result = await storageService.generateAndStorePoster(user.id, posterData);

    return NextResponse.json({
      success: true,
      message: 'Achievement poster generated successfully',
      posterUrl: result.posterUrl,
      sizeBytes: result.sizeBytes,
      metadata: payload,
    });
  } catch (err: any) {
    console.error('Error generating achievement poster:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to generate achievement poster.' },
      { status: err.status || 500 }
    );
  }
}
