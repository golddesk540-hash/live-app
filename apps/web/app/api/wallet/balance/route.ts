import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_DEMO_WALLET_USER_ID,
  getWalletSummary,
  logWalletAudit,
} from '@/lib/wallet';
import { canAccessPrivateWallet, resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isPreviewDemo = searchParams.get('preview') === 'demo';
    const bypassCache = searchParams.get('fresh') === 'true';
    const actor = await resolveWalletActor(req);

    const requestedUserId = searchParams.get('userId');
    const targetUserId = requestedUserId || (actor.user ? actor.user.id : DEFAULT_DEMO_WALLET_USER_ID);

    if (!canAccessPrivateWallet(actor, targetUserId, isPreviewDemo)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: You cannot view private financial balances belonging to another user.',
          code: 'PRIVATE_WALLET_ACCESS_DENIED',
        },
        { status: 403 }
      );
    }

    const wallet = await getWalletSummary(targetUserId, bypassCache);

    return NextResponse.json({
      success: true,
      wallet: {
        walletId: wallet.walletId,
        userId: wallet.userId,
        coins: wallet.coins,
        points: wallet.points,
        earningsPoints: wallet.points,
        totalSpentCoins: wallet.totalSpentCoins,
        totalReceivedPoints: wallet.totalReceivedPoints,
        isFrozen: wallet.isFrozen,
        hostSharePercentage: wallet.hostSharePercentage,
        currencySeparationNotice: 'Coins (for sending gifts) and Points (host gift earnings) are strictly separate balances.',
        updatedAt: wallet.updatedAt,
      },
    });
  } catch (err: any) {
    console.error('GET /api/wallet/balance error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to load wallet balance.' },
      { status: 500 }
    );
  }
}

async function rejectDirectMutation(req: NextRequest) {
  const actor = await resolveWalletActor(req);
  const body = await req.json().catch(() => ({}));
  const targetUserId = body?.userId || actor.actorId || 'unknown';

  await logWalletAudit({
    targetUserId,
    actionType: 'direct_client_balance_mutation_blocked',
    actorId: actor.actorId,
    actorRole: actor.actorRole,
    reason: 'Client attempted direct modification of wallet balance via /api/wallet/balance',
    balanceType: 'both',
    amount: Number(body?.coins ?? body?.points ?? 0) || 0,
    ipAddress: actor.ipAddress,
  });

  return NextResponse.json(
    {
      success: false,
      error: 'Forbidden: Clients cannot directly modify coin or point balances. Use approved server transactions.',
      code: 'DIRECT_CLIENT_MUTATION_FORBIDDEN',
    },
    { status: 403 }
  );
}

export async function POST(req: NextRequest) {
  return rejectDirectMutation(req);
}

export async function PUT(req: NextRequest) {
  return rejectDirectMutation(req);
}

export async function PATCH(req: NextRequest) {
  return rejectDirectMutation(req);
}
