import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, checkRateLimit } from '@/lib/auth';
import { validateRedeemCode } from '@/lib/storeApiService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/redeem/validate
 * Read-only check. Returns success/invalid sheet data without mutating DB.
 * Rate-limited (max 5 requests / 60 seconds) to prevent brute-force attacks.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to validate voucher codes.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Rate Limiting (Locked Rule & Security: prevent brute-forcing)
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const rateLimitKey = `redeem_rate_${user.id}_${clientIp}`;
    const rate = await checkRateLimit(rateLimitKey, 10, 60);

    if (!rate.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'TOO_MANY_REQUESTS: Too many voucher validation attempts. Please wait 60 seconds.',
          code: 'TOO_MANY_REQUESTS',
          remaining: 0,
          resetAt: rate.resetAt,
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const code = typeof body.code === 'string' ? body.code : '';

    const validation = await validateRedeemCode(user, code);

    return NextResponse.json({
      success: true,
      isValid: validation.isValid,
      code: validation.code,
      title: validation.title,
      rewardType: validation.rewardType,
      coinReward: validation.coinReward,
      bonusItem: validation.bonusItem,
      message: validation.message,
      errorCode: validation.error,
    });
  } catch (err: any) {
    if (err.code === 'AGE_RESTRICTION_18_PLUS') {
      return NextResponse.json(
        { success: false, error: err.message, code: 'AGE_RESTRICTION_18_PLUS' },
        { status: 403 }
      );
    }

    console.error('POST /api/redeem/validate error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to validate redeem code.' },
      { status: err.status || 500 }
    );
  }
}
