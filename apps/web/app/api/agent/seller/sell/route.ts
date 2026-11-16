import { NextRequest, NextResponse } from 'next/server';
import { resolveUserActor, verifyAgentPermissions, processCoinSale } from '@/lib/agentFinancials';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await resolveUserActor(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const auth = await verifyAgentPermissions(user.id, 'coin_seller');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error || 'Access denied. Authorized coin seller required.' }, { status: 403 });
    }

    const body = await req.json();
    const { customerIdentifier, packageId, idempotencyKey } = body;

    if (!customerIdentifier) {
      return NextResponse.json(
        { success: false, error: 'Customer identifier (Poppo ID, User ID, email, or phone) is required.' },
        { status: 400 }
      );
    }

    if (!packageId) {
      return NextResponse.json({ success: false, error: 'Package ID is required.' }, { status: 400 });
    }

    const result = await processCoinSale(user.id, {
      customerIdentifier,
      packageId,
      idempotencyKey,
    });

    return NextResponse.json({
      success: true,
      sale: result,
      message: `Successfully sold ${result.coinsAmount.toLocaleString()} coins to ${result.customerNickname}.`,
    });
  } catch (error: any) {
    console.error('Error processing coin sale:', error);
    const status = error.message?.includes('not found')
      ? 404
      : error.message?.includes('Insufficient') || error.message?.includes('Cannot sell')
      ? 400
      : error.message?.includes('not an authorized')
      ? 403
      : 500;

    return NextResponse.json(
      { success: false, error: error.message || 'FAILED_TO_PROCESS_SALE' },
      { status }
    );
  }
}
