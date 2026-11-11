import { NextRequest, NextResponse } from 'next/server';
import { getGiftDetails } from '@/lib/giftCatalog';
import { DEFAULT_DEMO_WALLET_USER_ID, getWalletSummary } from '@/lib/wallet';
import { canAccessPrivateWallet, resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { giftId: string } }
) {
  try {
    const gift = await getGiftDetails(params.giftId, { includeInactive: false });
    if (!gift) {
      return NextResponse.json(
        { success: false, error: 'Gift not found in catalog.', code: 'GIFT_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (!gift.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'This gift is currently disabled and unavailable for sending.',
          code: 'GIFT_DISABLED',
          isAvailableForSending: false,
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get('userId');
    const isPreviewDemo = searchParams.get('preview') === 'demo';
    let viewerCoinBalance: number | null = null;
    if (requestedUserId || isPreviewDemo) {
      const actor = await resolveWalletActor(req);
      const targetUserId = requestedUserId || (actor.user ? actor.user.id : DEFAULT_DEMO_WALLET_USER_ID);
      if (canAccessPrivateWallet(actor, targetUserId, isPreviewDemo)) {
        const wallet = await getWalletSummary(targetUserId).catch(() => null);
        viewerCoinBalance = wallet ? wallet.coins : null;
      }
    }

    return NextResponse.json({
      success: true,
      gift,
      isAvailableForSending: gift.isActive,
      viewerCoinBalance,
      coinDeducted: false, // Preview strictly never deducts coins
    });
  } catch (err: any) {
    console.error('GET /api/gifts/[giftId] error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve gift details.' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'Gift sending transactions belong to Module 7.3; catalog preview never deducts coins.',
      code: 'PREVIEW_ONLY_NO_TRANSACTION',
    },
    { status: 405 }
  );
}
