import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getUserInviteCode } from '@/lib/communityApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/community/invite/code
 * Returns caller's unique invite code and referral statistics.
 * Enforces Age 18+.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to access invite code.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const codeInfo = await getUserInviteCode(user);

    return NextResponse.json({
      success: true,
      inviteCode: codeInfo.inviteCode,
      code: codeInfo.inviteCode,
      shareUrl: codeInfo.shareUrl,
      totalInvitedCount: codeInfo.totalInvitedCount,
      totalCoinsEarned: codeInfo.totalCoinsEarned,
      bonusPerInviteCoins: codeInfo.bonusPerInviteCoins,
    });
  } catch (err: any) {
    if (err.code === 'AGE_RESTRICTION_18_PLUS') {
      return NextResponse.json(
        { success: false, error: err.message, code: 'AGE_RESTRICTION_18_PLUS' },
        { status: 403 }
      );
    }

    console.error('GET /api/community/invite/code error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve invite code.' },
      { status: err.status || 500 }
    );
  }
}
