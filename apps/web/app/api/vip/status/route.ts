import { NextRequest, NextResponse } from 'next/server';
import { resolveActiveUserVipProfile, resolveVipTargetUser } from '@/lib/vip';
import { vipErrorJson } from '@/lib/vipRouteHelpers';
import { resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const isPreviewDemo = searchParams.get('preview') === 'demo';
    const actor = await resolveWalletActor(req);
    const target = resolveVipTargetUser(actor, searchParams.get('userId'), isPreviewDemo);

    if (!target.allowed) {
      return NextResponse.json(
        { success: false, errorCode: target.errorCode, error: target.error },
        { status: target.statusCode }
      );
    }

    const vip = await resolveActiveUserVipProfile(target.userId, { includePendingOrder: true });
    return NextResponse.json({ success: true, module: '7.7', vip });
  } catch (err: any) {
    console.error('GET /api/vip/status error:', err);
    return vipErrorJson(err, 'Failed to resolve VIP status.');
  }
}

function rejectDirectVipMutation() {
  return NextResponse.json(
    {
      success: false,
      errorCode: 'CLIENT_VIP_OVERRIDE_FORBIDDEN',
      error: 'Direct client mutation of VIP status or benefits is strictly forbidden.',
    },
    { status: 403 }
  );
}

export async function POST() {
  return rejectDirectVipMutation();
}
export async function PUT() {
  return rejectDirectVipMutation();
}
export async function PATCH() {
  return rejectDirectVipMutation();
}
export async function DELETE() {
  return rejectDirectVipMutation();
}
