import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_PREVIEW_HOST_ID,
  canAccessHostEarnings,
  getHostEarningsHistory,
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
          error: 'Unauthorized: Cannot inspect private host earning history for another user.',
          code: 'EARNINGS_ACCESS_DENIED',
        },
        { status: 403 }
      );
    }

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status') || undefined;
    const sourceType = searchParams.get('sourceType') || undefined;
    const fromDate = searchParams.get('fromDate') || undefined;
    const toDate = searchParams.get('toDate') || undefined;
    const search = searchParams.get('search') || undefined;

    const history = await getHostEarningsHistory(targetHostId, {
      page,
      limit,
      status,
      sourceType,
      fromDate,
      toDate,
      search,
    });

    return NextResponse.json({
      success: true,
      hostUserId: targetHostId,
      ...history,
    });
  } catch (err: any) {
    console.error('GET /api/earnings/history error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve host earning history.' },
      { status: 500 }
    );
  }
}
