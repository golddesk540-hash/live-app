import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { subscribeVipPlan } from '@/lib/vipApiService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/vip/plans/:planId/subscribe
 * PART 4 & Tests 3, 4, 6:
 * Subscribes to a VIP plan using coin balance.
 * Enforces:
 * - Auth required (401)
 * - Server-side Age 18+ check (403)
 * - Atomic balance debit with row-level lock (400 if insufficient)
 * - Idempotency key prevent duplicate debit
 * - Creates coin_transactions and vip_membership_records
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> | { planId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to subscribe to VIP.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const planId = resolvedParams.planId;

    const body = await req.json().catch(() => ({}));
    const idempotencyKey =
      req.headers.get('idempotency-key') ||
      req.headers.get('x-idempotency-key') ||
      body.idempotencyKey ||
      undefined;

    const result = await subscribeVipPlan({
      user,
      planId,
      idempotencyKey,
    });

    return NextResponse.json({
      ...result,
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
    if (err.code === 'VIP_PLAN_NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: err.message, code: 'VIP_PLAN_NOT_FOUND' },
        { status: 404 }
      );
    }

    console.error('POST /api/vip/plans/:planId/subscribe error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'VIP subscription failed.', code: err.code || 'VIP_SUBSCRIBE_FAILED' },
      { status: err.status || 500 }
    );
  }
}
