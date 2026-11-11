import { NextRequest, NextResponse } from 'next/server';
import { listCoinPackages } from '@/lib/topup';
import { resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const includeInactive = req.nextUrl.searchParams.get('includeInactive') === 'true';
    if (includeInactive) {
      const actor = await resolveWalletActor(req);
      if (!actor.isFinanceAdmin) {
        return NextResponse.json(
          { success: false, errorCode: 'FINANCE_ADMIN_REQUIRED', error: 'Forbidden: Finance admin access required.' },
          { status: 403 }
        );
      }
    }
    const packages = await listCoinPackages({ includeInactive });
    return NextResponse.json({
      success: true,
      module: '7.6',
      packages,
    });
  } catch (err: any) {
    console.error('GET /api/topup/packages error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to load coin packages.' },
      { status: 500 }
    );
  }
}
