import { NextRequest, NextResponse } from 'next/server';
import { canAccessTopupUser, getTopupHistory } from '@/lib/topup';
import { DEFAULT_DEMO_WALLET_USER_ID } from '@/lib/wallet';
import { resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const isPreviewDemo = searchParams.get('preview') === 'demo';
    const actor = await resolveWalletActor(req);

    const requestedUserId = searchParams.get('userId')?.trim();
    const targetUserId =
      requestedUserId ||
      (actor.user ? actor.user.id : isPreviewDemo ? DEFAULT_DEMO_WALLET_USER_ID : '');

    if (!targetUserId || !canAccessTopupUser(actor, targetUserId, isPreviewDemo)) {
      return NextResponse.json(
        {
          success: false,
          errorCode: 'TOPUP_ACCESS_DENIED',
          error: 'Unauthorized: Cannot inspect another user top-up history.',
        },
        { status: actor.actorId === 'anonymous' && !isPreviewDemo ? 401 : 403 }
      );
    }

    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const history = await getTopupHistory({
      userId: targetUserId,
      status,
      page: Number.isFinite(page) ? page : 1,
      limit: Number.isFinite(limit) ? limit : 20,
    });

    return NextResponse.json({
      success: true,
      userId: targetUserId,
      ...history,
    });
  } catch (err: any) {
    console.error('GET /api/topup/history error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to load top-up history.' },
      { status: 500 }
    );
  }
}
