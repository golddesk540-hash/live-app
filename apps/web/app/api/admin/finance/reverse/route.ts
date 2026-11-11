import { NextRequest, NextResponse } from 'next/server';
import { reverseWalletTransaction } from '@/lib/wallet';
import { resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const actor = await resolveWalletActor(req);
    const body = await req.json().catch(() => ({}));
    const { transactionId, ledgerType = 'coins', reason } = body;

    if (!transactionId || !['coins', 'points'].includes(ledgerType)) {
      return NextResponse.json(
        { success: false, error: 'Valid transactionId and ledgerType (coins|points) are required.' },
        { status: 400 }
      );
    }

    const result = await reverseWalletTransaction({
      transactionId,
      ledgerType,
      adminId: actor.actorId,
      actorRole: actor.actorRole,
      reason: String(reason || ''),
      ipAddress: actor.ipAddress,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('POST /api/admin/finance/reverse error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to reverse transaction.',
        code: err?.code || 'REVERSAL_FAILED',
      },
      { status: err?.status || 500 }
    );
  }
}
