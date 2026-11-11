import { NextRequest, NextResponse } from 'next/server';
import { queryAdminHostEarnings } from '@/lib/hostEarnings';
import { isAuthorizedFinanceAdmin } from '@/lib/wallet';
import { resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const actor = await resolveWalletActor(req);
    if (!isAuthorizedFinanceAdmin(actor.actorRole)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Only authorized finance administrators can view host share and platform share reports.',
          code: 'FINANCE_ADMIN_REQUIRED',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const result = await queryAdminHostEarnings({
      hostUserId: searchParams.get('hostUserId') || undefined,
      senderUserId: searchParams.get('senderUserId') || undefined,
      giftId: searchParams.get('giftId') || undefined,
      status: searchParams.get('status') || undefined,
      fromDate: searchParams.get('fromDate') || undefined,
      toDate: searchParams.get('toDate') || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '40', 10),
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    console.error('GET /api/admin/finance/earnings error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to load finance host earnings report.' },
      { status: 500 }
    );
  }
}
