import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, checkRateLimit } from '@/lib/auth';
import { redeemCodeAtomic } from '@/lib/storeApiService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/redeem/redeem
 * Atomically redeems a voucher code.
 * Reuses P7-P7 coin ledger (credits coins to user_wallets + inserts coin_transactions row).
 * Records redeem_history with unique constraint (user_id, code_id).
 * Rate-limited (max 5 requests / 60 seconds) to prevent brute-forcing.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to redeem voucher codes.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Rate Limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const rateLimitKey = `redeem_rate_${user.id}_${clientIp}`;
    const rate = await checkRateLimit(rateLimitKey, 10, 60);

    if (!rate.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'TOO_MANY_REQUESTS: Too many voucher redemption attempts. Please wait 60 seconds.',
          code: 'TOO_MANY_REQUESTS',
          remaining: 0,
          resetAt: rate.resetAt,
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawCode = typeof body.code === 'string' ? body.code : '';
    const idempotencyKey =
      req.headers.get('x-idempotency-key') ||
      (typeof body.idempotencyKey === 'string' ? body.idempotencyKey : null);

    const result = await redeemCodeAtomic({
      user,
      rawCode,
      idempotencyKey,
    });

    return NextResponse.json({
      success: true,
      deduplicated: Boolean(result.deduplicated),
      code: result.code,
      coinReward: result.coinReward,
      bonusItem: result.bonusItem,
      newBalance: result.newBalance,
      transactionId: result.transactionId,
      redeemedAt: result.redeemedAt,
      message: `Successfully redeemed ${result.coinReward.toLocaleString()} coins!`,
    });
  } catch (err: any) {
    if (err.code === 'AGE_RESTRICTION_18_PLUS') {
      return NextResponse.json(
        { success: false, error: err.message, code: 'AGE_RESTRICTION_18_PLUS' },
        { status: 403 }
      );
    }
    if (err.code === 'ALREADY_REDEEMED') {
      return NextResponse.json(
        { success: false, error: err.message, code: 'ALREADY_REDEEMED' },
        { status: 409 }
      );
    }
    if (err.code === 'CODE_EXPIRED' || err.code === 'CODE_INACTIVE' || err.code === 'INVALID_CODE') {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: 400 }
      );
    }

    console.error('POST /api/redeem/redeem error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to redeem voucher code.', code: err.code || 'REDEEM_FAILED' },
      { status: err.status || 500 }
    );
  }
}
