import { NextRequest, NextResponse } from 'next/server';
import {
  canAccessTopupUser,
  createTopupPaymentOrder,
  detectTamperedTopupKeys,
  TopupPlatform,
} from '@/lib/topup';
import { DEFAULT_DEMO_WALLET_USER_ID } from '@/lib/wallet';
import { resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

function resolveTargetUser(
  actor: Awaited<ReturnType<typeof resolveWalletActor>>,
  requestedUserId: string | null | undefined,
  isPreviewDemo: boolean
): { allowed: boolean; statusCode: number; errorCode?: string; error?: string; userId: string } {
  const reqId = (requestedUserId || '').trim();
  if (actor.user) {
    if (reqId && reqId !== actor.user.id && reqId !== actor.user.poppo_id && !actor.isFinanceAdmin) {
      return {
        allowed: false,
        statusCode: 403,
        errorCode: 'UNAUTHORIZED_TOPUP_USER',
        error: 'Cannot initiate coin top-up orders on behalf of another user.',
        userId: actor.user.id,
      };
    }
    return { allowed: true, statusCode: 200, userId: reqId || actor.user.id };
  }

  const candidateId =
    reqId ||
    (actor.actorId !== 'anonymous' ? actor.actorId : '') ||
    (isPreviewDemo ? DEFAULT_DEMO_WALLET_USER_ID : '');

  if (!candidateId || !canAccessTopupUser(actor, candidateId, isPreviewDemo)) {
    return {
      allowed: false,
      statusCode: actor.actorId === 'anonymous' && !isPreviewDemo ? 401 : 403,
      errorCode: 'TOPUP_ACCESS_DENIED',
      error: 'Authentication or active preview demo session is required to top up coins.',
      userId: '',
    };
  }

  return { allowed: true, statusCode: 200, userId: candidateId };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const tamperedKey = detectTamperedTopupKeys(body);
    if (tamperedKey) {
      return NextResponse.json(
        {
          success: false,
          errorCode: 'CLIENT_FINANCIAL_OVERRIDE_FORBIDDEN',
          error: `Client override field '${tamperedKey}' is strictly forbidden. All package pricing, coins, bonus coins, and payment states come strictly from the backend.`,
        },
        { status: 403 }
      );
    }

    const actor = await resolveWalletActor(req);
    const isPreviewDemo = req.nextUrl.searchParams.get('preview') === 'demo';
    const access = resolveTargetUser(actor, body.userId, isPreviewDemo);
    if (!access.allowed) {
      return NextResponse.json(
        { success: false, errorCode: access.errorCode, error: access.error },
        { status: access.statusCode }
      );
    }

    const packageId = String(body.packageId || '').trim();
    const providerKey = String(body.providerKey || 'sandbox_verified').trim();
    const rawPlatform = String(body.platform || 'web').trim().toLowerCase();
    const platform: TopupPlatform = (['web', 'android', 'ios'].includes(rawPlatform)
      ? rawPlatform
      : 'web') as TopupPlatform;
    const idempotencyKey =
      body.idempotencyKey || req.headers.get('x-idempotency-key')
        ? String(body.idempotencyKey || req.headers.get('x-idempotency-key'))
        : null;

    if (!packageId) {
      return NextResponse.json(
        { success: false, errorCode: 'PACKAGE_ID_REQUIRED', error: 'packageId is required.' },
        { status: 400 }
      );
    }

    const created = await createTopupPaymentOrder({
      userId: access.userId,
      packageId,
      providerKey,
      platform,
      idempotencyKey,
      clientIp: actor.ipAddress,
    });

    return NextResponse.json(created, { status: created.deduplicated ? 200 : 201 });
  } catch (err: any) {
    console.error('POST /api/topup/orders error:', err);
    return NextResponse.json(
      {
        success: false,
        errorCode: err?.code || 'TOPUP_ORDER_FAILED',
        error: err?.message || 'Failed to create top-up order.',
      },
      { status: err?.status || 500 }
    );
  }
}
