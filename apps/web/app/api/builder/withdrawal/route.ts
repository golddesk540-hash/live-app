import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { requestWithdrawal } from '@/lib/finalApiService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const body = await req.json();
    const idempotencyKey = req.headers.get('x-idempotency-key') || body.idempotencyKey;

    const res = await requestWithdrawal(user, {
      amount: body.amount,
      payoutMethodId: body.payoutMethodId,
      idempotencyKey,
    });

    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message, code: err.code || 'WITHDRAWAL_ERROR' },
      { status: err.status || 500 }
    );
  }
}
