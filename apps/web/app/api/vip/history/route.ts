import { NextRequest, NextResponse } from 'next/server';
import { getVipMembershipHistory, resolveVipTargetUser } from '@/lib/vip';
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

    const page = parseInt(searchParams.get('page') || '1', 10) || 1;
    const limit = parseInt(searchParams.get('limit') || '20', 10) || 20;
    const statusFilter = searchParams.get('status') || 'all';

    const history = await getVipMembershipHistory({
      actor,
      userId: target.userId,
      statusFilter,
      page,
      limit,
      isPreviewDemo,
    });

    return NextResponse.json({
      success: true,
      module: '7.7',
      userId: target.userId,
      ...history,
    });
  } catch (err: any) {
    console.error('GET /api/vip/history error:', err);
    return vipErrorJson(err, 'Failed to load VIP membership history.');
  }
}
