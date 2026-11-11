import { NextRequest, NextResponse } from 'next/server';
import { exportAdminHostEarningsCsv } from '@/lib/hostEarnings';
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
          error: 'Forbidden: Only authorized finance administrators can export host earnings reports.',
          code: 'FINANCE_ADMIN_REQUIRED',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const csv = await exportAdminHostEarningsCsv({
      hostUserId: searchParams.get('hostUserId') || undefined,
      senderUserId: searchParams.get('senderUserId') || undefined,
      giftId: searchParams.get('giftId') || undefined,
      status: searchParams.get('status') || undefined,
      fromDate: searchParams.get('fromDate') || undefined,
      toDate: searchParams.get('toDate') || undefined,
      search: searchParams.get('search') || undefined,
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="popo-host-earnings-report.csv"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error('GET /api/admin/finance/earnings/export error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to export earnings report.' },
      { status: 500 }
    );
  }
}
