import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_DEMO_WALLET_USER_ID, getWalletSummary } from '@/lib/wallet';
import { canAccessPrivateWallet, resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { searchParams } = new URL(req.url);
    const isPreviewDemo = searchParams.get('preview') === 'demo' || Boolean(body?.previewDemo);
    const actor = await resolveWalletActor(req);

    const targetUserId = body?.userId || searchParams.get('userId') || (actor.user ? actor.user.id : DEFAULT_DEMO_WALLET_USER_ID);

    if (!canAccessPrivateWallet(actor, targetUserId, isPreviewDemo)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized wallet refresh request.', code: 'PRIVATE_WALLET_ACCESS_DENIED' },
        { status: 403 }
      );
    }

    const wallet = await getWalletSummary(targetUserId, true);

    return NextResponse.json({
      success: true,
      refreshedAt: new Date().toISOString(),
      wallet,
    });
  } catch (err: any) {
    console.error('POST /api/wallet/refresh error:', err);
    return NextResponse.json({ success: false, error: 'Failed to refresh wallet.' }, { status: 500 });
  }
}
