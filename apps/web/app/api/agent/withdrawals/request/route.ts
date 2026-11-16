import { NextRequest, NextResponse } from 'next/server';
import { resolveUserActor, verifyAgentPermissions, requestWithdrawal } from '@/lib/agentFinancials';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await resolveUserActor(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const auth = await verifyAgentPermissions(user.id);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error || 'Access denied.' }, { status: 403 });
    }

    const body = await req.json();
    const { pointsAmount, payoutMethodId } = body;

    if (!pointsAmount || typeof pointsAmount !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Points amount (numeric) is required.' },
        { status: 400 }
      );
    }

    if (!payoutMethodId) {
      return NextResponse.json(
        { success: false, error: 'Payout method ID is required.' },
        { status: 400 }
      );
    }

    const withdrawal = await requestWithdrawal(user.id, {
      pointsAmount,
      payoutMethodId,
    });

    return NextResponse.json({
      success: true,
      withdrawal,
      message: `Withdrawal request for $${withdrawal.fiatAmount} submitted successfully.`,
    });
  } catch (error: any) {
    console.error('Error submitting withdrawal request:', error);
    const status = error.message?.includes('not found')
      ? 404
      : error.message?.includes('Minimum') ||
        error.message?.includes('Maximum') ||
        error.message?.includes('Insufficient') ||
        error.message?.includes('verified')
      ? 400
      : 500;

    return NextResponse.json(
      { success: false, error: error.message || 'FAILED_TO_REQUEST_WITHDRAWAL' },
      { status }
    );
  }
}
