import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_PREVIEW_HOST_ID,
  HostEarningsError,
  canAccessHostEarnings,
  getHostEarningsDashboard,
} from '@/lib/hostEarnings';
import { resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isPreviewDemo = searchParams.get('preview') === 'demo';
    const actor = await resolveWalletActor(req);

    const requestedHostId = searchParams.get('hostUserId') || searchParams.get('userId');
    const targetHostId = requestedHostId || (actor.user ? actor.user.id : DEFAULT_PREVIEW_HOST_ID);

    if (!canAccessHostEarnings(actor, targetHostId, isPreviewDemo)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Cannot view private host earnings data for another user.',
          code: 'EARNINGS_ACCESS_DENIED',
        },
        { status: 403 }
      );
    }

    const fresh = searchParams.get('fresh') === 'true';
    const dashboard = await getHostEarningsDashboard(targetHostId, { fresh });

    return NextResponse.json({
      success: true,
      dashboard,
    });
  } catch (err: any) {
    if (err instanceof HostEarningsError) {
      return NextResponse.json(
        { success: false, errorCode: err.errorCode, error: err.message },
        { status: err.statusCode }
      );
    }
    console.error('GET /api/earnings/dashboard error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to load host earnings dashboard.' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      errorCode: 'DIRECT_EARNINGS_MUTATION_FORBIDDEN',
      error: 'Direct client mutation of host points or share percentages is strictly forbidden.',
    },
    { status: 403 }
  );
}
