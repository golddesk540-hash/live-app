import { NextRequest, NextResponse } from 'next/server';
import {
  createVipPurchaseOrder,
  detectTamperedVipKeys,
  resolveVipTargetUser,
  VipServiceError,
} from '@/lib/vip';
import { resolveWalletActor, type WalletActorContext } from '@/lib/walletAuth';

export function vipErrorJson(err: any, fallbackMessage = 'VIP operation failed.'): NextResponse {
  if (err instanceof VipServiceError) {
    return NextResponse.json(
      { success: false, errorCode: err.code, error: err.message },
      { status: err.status }
    );
  }
  return NextResponse.json(
    {
      success: false,
      errorCode: err?.code || 'INTERNAL_VIP_ERROR',
      error: err?.message || fallbackMessage,
    },
    { status: err?.status || 500 }
  );
}

export async function requireVipFinanceAdmin(
  req: NextRequest
): Promise<{ ok: true; actor: WalletActorContext } | { ok: false; response: NextResponse }> {
  const actor = await resolveWalletActor(req);
  if (!actor.isFinanceAdmin) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          errorCode: 'FINANCE_ADMIN_REQUIRED',
          error: 'Forbidden: Only authorized finance administrators may manage VIP plans, statuses, or refunds.',
        },
        { status: 403 }
      ),
    };
  }
  return { ok: true, actor };
}

export async function handleVipOrderPost(
  req: NextRequest,
  orderType: 'purchase' | 'renewal'
): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => ({}));
    const tamperedKey = detectTamperedVipKeys(body);
    if (tamperedKey) {
      return NextResponse.json(
        {
          success: false,
          errorCode: 'CLIENT_VIP_OVERRIDE_FORBIDDEN',
          error: `Security violation: Client cannot override VIP pricing or benefits field "${tamperedKey}".`,
        },
        { status: 403 }
      );
    }

    const isPreviewDemo = req.nextUrl.searchParams.get('preview') === 'demo';
    const actor = await resolveWalletActor(req);
    const target = resolveVipTargetUser(actor, body.userId, isPreviewDemo);
    if (!target.allowed) {
      return NextResponse.json(
        { success: false, errorCode: target.errorCode, error: target.error },
        { status: target.statusCode }
      );
    }

    const planId = String(body.planId || '').trim();
    const providerKey = String(body.providerKey || body.paymentMethod || '').trim();
    if (!planId || !providerKey) {
      return NextResponse.json(
        {
          success: false,
          errorCode: 'VIP_ORDER_INPUT_REQUIRED',
          error: 'planId and providerKey are required.',
        },
        { status: 400 }
      );
    }

    const result = await createVipPurchaseOrder({
      userId: target.userId,
      planId,
      providerKey,
      orderType,
      targetMembershipId: body.membershipId || null,
      platform: body.platform || 'web',
      autoRenewConsent: Boolean(body.autoRenewConsent),
      idempotencyKey: req.headers.get('x-idempotency-key') || body.idempotencyKey || null,
      rawBody: body,
    });

    return NextResponse.json(
      {
        success: true,
        module: '7.7',
        ...result,
      },
      { status: result.deduplicated ? 200 : 201 }
    );
  } catch (err: any) {
    console.error(`POST /api/vip/${orderType} error:`, err);
    return vipErrorJson(err, `Failed to process VIP ${orderType}.`);
  }
}
