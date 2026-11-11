import { NextRequest, NextResponse } from 'next/server';
import { creditCoins, logWalletAudit } from '@/lib/wallet';
import { resolveWalletActor, verifyApprovedTopupSignature } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const actor = await resolveWalletActor(req);
    const body = await req.json().catch(() => ({}));
    const { userId, amount, referenceId, idempotencyKey, description } = body;

    if (!userId || !Number.isInteger(amount) || amount <= 0 || !referenceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId, positive integer amount, and approved payment referenceId are required.',
          code: 'INVALID_TOPUP_PARAMS',
        },
        { status: 400 }
      );
    }

    const gatewaySig = req.headers.get('x-topup-signature');
    const isGatewayAuthorized = verifyApprovedTopupSignature(userId, amount, referenceId, gatewaySig);

    if (!actor.isFinanceAdmin && !isGatewayAuthorized) {
      await logWalletAudit({
        targetUserId: userId,
        actionType: 'unauthorized_topup_credit_blocked',
        actorId: actor.actorId,
        actorRole: actor.actorRole,
        reason: `Blocked unverified coin top-up credit attempt (${amount} coins, ref: ${referenceId})`,
        balanceType: 'coins',
        amount,
        ipAddress: actor.ipAddress,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Coins can only be credited via verified payment gateway webhooks or authorized finance administrators.',
          code: 'UNAUTHORIZED_TOPUP_CREDIT',
        },
        { status: 403 }
      );
    }

    const res = await creditCoins({
      userId,
      amount,
      transactionType: 'topup',
      referenceId,
      idempotencyKey: idempotencyKey || `TOPUP_${referenceId}`,
      description: description || `Approved Coin Top-up (${referenceId})`,
      createdBy: isGatewayAuthorized ? 'payment_gateway' : actor.actorId,
      metadata: {
        verifiedByGateway: isGatewayAuthorized,
        approvedByAdmin: actor.isFinanceAdmin ? actor.actorId : null,
      },
    });

    return NextResponse.json({
      success: true,
      isDuplicate: Boolean(res.isDuplicate),
      transaction: res.transaction,
      wallet: res.wallet,
    });
  } catch (err: any) {
    console.error('POST /api/wallet/topup/credit error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to credit approved top-up.', code: err?.code },
      { status: err?.status || 500 }
    );
  }
}
