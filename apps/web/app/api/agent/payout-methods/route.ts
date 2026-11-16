import { NextRequest, NextResponse } from 'next/server';
import { resolveUserActor, verifyAgentPermissions, getPayoutMethods, addPayoutMethod } from '@/lib/agentFinancials';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await resolveUserActor(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const auth = await verifyAgentPermissions(user.id);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error || 'Access denied.' }, { status: 403 });
    }

    const methods = await getPayoutMethods(user.id);

    return NextResponse.json({
      success: true,
      payoutMethods: methods,
    });
  } catch (error: any) {
    console.error('Error fetching payout methods:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'FAILED_TO_FETCH_PAYOUT_METHODS' },
      { status: 500 }
    );
  }
}

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
    const { provider, accountTitle, accountNumber, bankName, isDefault } = body;

    if (!provider || !accountTitle || !accountNumber) {
      return NextResponse.json(
        { success: false, error: 'Provider, account title, and account number are required.' },
        { status: 400 }
      );
    }

    const method = await addPayoutMethod(user.id, {
      provider,
      accountTitle,
      accountNumber,
      bankName,
      isDefault,
    });

    return NextResponse.json({
      success: true,
      payoutMethod: method,
      message: 'Payout method added successfully.',
    });
  } catch (error: any) {
    console.error('Error adding payout method:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'FAILED_TO_ADD_PAYOUT_METHOD' },
      { status: 400 }
    );
  }
}
