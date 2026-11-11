import { NextRequest, NextResponse } from 'next/server';
import { adminSearchWallets } from '@/lib/wallet';
import { resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const actor = await resolveWalletActor(req);
    if (!actor.isAdminReadOnly && !actor.isFinanceAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Administrator privileges required to inspect wallets.',
          code: 'ADMIN_ACCESS_REQUIRED',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || searchParams.get('userId') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);

    const data = await adminSearchWallets(search, page, limit);

    return NextResponse.json({
      success: true,
      wallets: data.wallets,
      total: data.total,
      page,
      limit,
      actorRole: actor.actorRole,
      canAdjustBalances: actor.isFinanceAdmin,
    });
  } catch (err: any) {
    console.error('GET /api/admin/finance/wallets error:', err);
    return NextResponse.json({ success: false, error: 'Failed to search user wallets.' }, { status: 500 });
  }
}
