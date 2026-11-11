import { NextRequest, NextResponse } from 'next/server';
import { resolveVipTargetUser, triggerVipSandboxAction } from '@/lib/vip';
import { vipErrorJson } from '@/lib/vipRouteHelpers';
import { resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const isPreviewDemo = req.nextUrl.searchParams.get('preview') === 'demo';
    const actor = await resolveWalletActor(req);
    const target = resolveVipTargetUser(actor, body.userId, isPreviewDemo);
    if (!target.allowed) {
      return NextResponse.json(
        { success: false, errorCode: target.errorCode, error: target.error },
        { status: target.statusCode }
      );
    }

    const orderId = String(body.orderId || '').trim();
    if (!orderId) {
      return NextResponse.json(
        { success: false, errorCode: 'ORDER_ID_REQUIRED', error: 'orderId is required.' },
        { status: 400 }
      );
    }

    const outcome = body.outcome === 'fail' ? 'fail' : 'succeed';
    const res = await triggerVipSandboxAction({
      orderId,
      userId: target.userId,
      outcome,
    });

    return NextResponse.json({ module: '7.7', ...res });
  } catch (err: any) {
    console.error('POST /api/vip/sandbox/complete error:', err);
    return vipErrorJson(err, 'Sandbox VIP simulation failed.');
  }
}
