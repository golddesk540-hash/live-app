import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, checkRateLimit } from '@/lib/auth';
import { becomeGuardianAtomic } from '@/lib/communityApiService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/community/guardians/become
 * Purchases a Guardian contract with atomic coin debit from P7-P7 ledger.
 * Enforces Age 18+ and creates active guardian record with expiry.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to become a guardian.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Rate Limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const rate = await checkRateLimit(`guardian_rate_${user.id}_${clientIp}`, 10, 60);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait a minute.', code: 'TOO_MANY_REQUESTS' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const hostId = typeof body.hostId === 'string' ? body.hostId : '';
    const tier = typeof body.tier === 'string' ? body.tier : 'guardian_angel';
    const idempotencyKey =
      req.headers.get('x-idempotency-key') ||
      (typeof body.idempotencyKey === 'string' ? body.idempotencyKey : null);

    const result = await becomeGuardianAtomic({
      user,
      hostId,
      tier,
      idempotencyKey,
    });

    return NextResponse.json({
      success: true,
      deduplicated: Boolean(result.deduplicated),
      guardian: result.guardian,
      newBalance: result.newBalance,
      transactionId: result.transactionId,
      message: `You are now an active ${result.guardian.tier}!`,
    });
  } catch (err: any) {
    if (err.code === 'AGE_RESTRICTION_18_PLUS') {
      return NextResponse.json(
        { success: false, error: err.message, code: 'AGE_RESTRICTION_18_PLUS' },
        { status: 403 }
      );
    }
    if (err.code === 'INSUFFICIENT_COINS') {
      return NextResponse.json(
        { success: false, error: err.message, code: 'INSUFFICIENT_COINS' },
        { status: 400 }
      );
    }

    console.error('POST /api/community/guardians/become error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to become guardian.', code: err.code || 'GUARDIAN_PURCHASE_FAILED' },
      { status: err.status || 500 }
    );
  }
}
