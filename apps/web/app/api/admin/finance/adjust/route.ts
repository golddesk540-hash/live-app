import { NextRequest, NextResponse } from 'next/server';
import { adminAdjustWalletBalance } from '@/lib/wallet';
import { resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const actor = await resolveWalletActor(req);
    const body = await req.json().catch(() => ({}));

    const {
      targetUserId,
      balanceType = 'coins',
      operation = 'credit',
      amount,
      reason,
      idempotencyKey,
    } = body;

    if (!targetUserId || !['coins', 'points'].includes(balanceType) || !['credit', 'debit'].includes(operation)) {
      return NextResponse.json(
        { success: false, error: 'Valid targetUserId, balanceType (coins|points), and operation (credit|debit) are required.' },
        { status: 400 }
      );
    }

    const result = await adminAdjustWalletBalance({
      targetUserId,
      balanceType,
      operation,
      amount: Number(amount),
      adminId: actor.actorId,
      actorRole: actor.actorRole,
      reason: String(reason || ''),
      idempotencyKey,
      ipAddress: actor.ipAddress,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('POST /api/admin/finance/adjust error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to adjust wallet balance.',
        code: err?.code || 'ADJUSTMENT_FAILED',
      },
      { status: err?.status || 500 }
    );
  }
}
