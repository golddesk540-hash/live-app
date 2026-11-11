import { NextRequest, NextResponse } from 'next/server';
import { cancelUserVipMembership, resolveVipTargetUser } from '@/lib/vip';
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

    const result = await cancelUserVipMembership({
      actor,
      userId: target.userId,
      membershipId: body.membershipId || null,
      cancelMode: body.cancelMode === 'auto_renew_only' ? 'auto_renew_only' : 'immediate',
      reason: typeof body.reason === 'string' ? body.reason : undefined,
    });

    return NextResponse.json({
      success: true,
      module: '7.7',
      ...result,
    });
  } catch (err: any) {
    console.error('POST /api/vip/cancel error:', err);
    return vipErrorJson(err, 'Failed to cancel VIP membership.');
  }
}
