import { NextRequest, NextResponse } from 'next/server';
import { adminQueryTopupOrders } from '@/lib/topup';
import { resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const actor = await resolveWalletActor(req);
    if (!actor.isFinanceAdmin) {
      return NextResponse.json(
        { success: false, errorCode: 'FINANCE_ADMIN_REQUIRED', error: 'Forbidden: Finance admin access required.' },
        { status: 403 }
      );
    }

    const { searchParams } = req.nextUrl;
    const data = await adminQueryTopupOrders({
      actorRole: actor.actorRole,
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '25', 10),
    });

    return NextResponse.json({ success: true, ...data });
  } catch (err: any) {
    console.error('GET /api/admin/finance/topup/orders error:', err);
    return NextResponse.json(
      { success: false, errorCode: err?.code, error: err?.message || 'Failed to load orders.' },
      { status: err?.status || 500 }
    );
  }
}
