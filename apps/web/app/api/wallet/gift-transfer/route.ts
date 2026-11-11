import { NextRequest, NextResponse } from 'next/server';
import { logWalletAudit, processAtomicGiftTransfer } from '@/lib/wallet';
import { resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const actor = await resolveWalletActor(req);
    const body = await req.json().catch(() => ({}));

    // Strictly forbid clients from supplying spoofed share percentages, point values, or balances
    if (
      body.hostPoints !== undefined ||
      body.overrideBalance !== undefined ||
      body.sharePercentage !== undefined ||
      body.newBalance !== undefined ||
      body.coins !== undefined
    ) {
      await logWalletAudit({
        targetUserId: body.senderId || actor.actorId,
        actionType: 'client_financial_tamper_attempt',
        actorId: actor.actorId,
        actorRole: actor.actorRole,
        reason: 'Client attempted to override hostPoints, sharePercentage, or wallet balance in gift-transfer',
        balanceType: 'both',
        ipAddress: actor.ipAddress,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Financial values and 70% host share are calculated strictly by the backend.',
          code: 'CLIENT_FINANCIAL_OVERRIDE_FORBIDDEN',
        },
        { status: 403 }
      );
    }

    const {
      senderId,
      senderName = 'Viewer',
      hostUserId,
      giftCoins,
      giftName = 'Virtual Gift',
      isPkBattle = false,
      referenceId,
      idempotencyKey,
    } = body;

    if (!senderId || !hostUserId) {
      return NextResponse.json(
        { success: false, error: 'senderId and hostUserId are required.' },
        { status: 400 }
      );
    }

    if (!Number.isInteger(giftCoins) || giftCoins <= 0) {
      return NextResponse.json(
        { success: false, error: 'giftCoins must be a positive integer.', code: 'INVALID_AMOUNT' },
        { status: 400 }
      );
    }

    // If an authenticated non-admin user tries to spend from someone else's wallet -> reject!
    if (actor.user && !actor.isFinanceAdmin && actor.user.id !== senderId && actor.user.poppo_id !== senderId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: You can only send gifts using your own coin wallet.',
          code: 'UNAUTHORIZED_WALLET_SPEND',
        },
        { status: 403 }
      );
    }

    const result = await processAtomicGiftTransfer({
      senderId,
      senderName,
      hostUserId,
      giftCoins,
      giftName,
      isPkBattle: Boolean(isPkBattle),
      referenceId,
      idempotencyKey,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          code: result.code || 'TRANSFER_FAILED',
          transaction: result.coinTransaction,
          senderWallet: result.senderWallet,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      isDuplicate: Boolean(result.isDuplicate),
      coinTransaction: result.coinTransaction,
      pointsTransaction: result.pointsTransaction,
      senderWallet: result.senderWallet,
      hostWallet: result.hostWallet,
      financialSummary: {
        coinsDeducted: giftCoins,
        hostPointsEarned: result.hostPointsEarned,
        hostSharePercentage: result.sharePercent,
      },
    });
  } catch (err: any) {
    console.error('POST /api/wallet/gift-transfer error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to process gift wallet transfer.' },
      { status: err?.status || 500 }
    );
  }
}
