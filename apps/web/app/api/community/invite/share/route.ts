import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, checkRateLimit } from '@/lib/auth';
import { getInviteSharePayload } from '@/lib/communityApiService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/community/invite/share
 * Returns share text, referral URL, and QR placeholder for invite sharing.
 * Rate-limited to prevent abuse.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to share invite code.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Rate Limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const rate = await checkRateLimit(`invite_share_${user.id}_${clientIp}`, 15, 60);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait a minute.', code: 'TOO_MANY_REQUESTS' },
        { status: 429 }
      );
    }

    const payload = await getInviteSharePayload(user);

    return NextResponse.json({
      success: true,
      inviteCode: payload.inviteCode,
      code: payload.inviteCode,
      shareText: payload.shareText,
      shareUrl: payload.shareUrl,
      qrCodeUrl: payload.qrCodeUrl,
    });
  } catch (err: any) {
    if (err.code === 'AGE_RESTRICTION_18_PLUS') {
      return NextResponse.json(
        { success: false, error: err.message, code: 'AGE_RESTRICTION_18_PLUS' },
        { status: 403 }
      );
    }

    console.error('POST /api/community/invite/share error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to generate invite share payload.' },
      { status: err.status || 500 }
    );
  }
}
