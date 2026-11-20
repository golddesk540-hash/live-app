import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { claimReward } from '@/lib/vipApiService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/rewards/:rewardId/claim
 * PART 4 & Tests 8, 9, 11, 12:
 * Claims reward points atomically for a completed task.
 * Enforces:
 * - Authentication required (401)
 * - Server-side Age 18+ check (403)
 * - Task completion verification (400)
 * - Unique one-time claim constraint (409)
 * - Atomic credit to points_wallets with points_transactions row
 * - Idempotency key protection against double-claim
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ rewardId: string }> | { rewardId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to claim rewards.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const rewardId = resolvedParams.rewardId;

    const body = await req.json().catch(() => ({}));
    const idempotencyKey =
      req.headers.get('idempotency-key') ||
      req.headers.get('x-idempotency-key') ||
      body.idempotencyKey ||
      undefined;

    const result = await claimReward({
      user,
      rewardId,
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
    if (err.code === 'REWARD_ALREADY_CLAIMED') {
      return NextResponse.json(
        { success: false, error: err.message, code: 'REWARD_ALREADY_CLAIMED' },
        { status: 409 }
      );
    }
    if (err.code === 'REWARD_NOT_ELIGIBLE') {
      return NextResponse.json(
        { success: false, error: err.message, code: 'REWARD_NOT_ELIGIBLE' },
        { status: 400 }
      );
    }
    if (err.code === 'TASK_NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: err.message, code: 'TASK_NOT_FOUND' },
        { status: 404 }
      );
    }

    console.error('POST /api/rewards/:rewardId/claim error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Reward claim failed.', code: err.code || 'REWARD_CLAIM_FAILED' },
      { status: err.status || 500 }
    );
  }
}
