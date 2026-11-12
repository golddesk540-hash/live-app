import { NextRequest, NextResponse } from 'next/server';
import { queryAdminHostEarningsReport } from '@/lib/financeExport';
import { financeErrorJson, requireAuthorizedFinanceAdmin } from '@/lib/financeRouteHelpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuthorizedFinanceAdmin(req);
    if (!auth.ok) return auth.response;

    const url = new URL(req.url);
    const data = await queryAdminHostEarningsReport(
      auth.actor,
      {
        preset: url.searchParams.get('preset'),
        fromDate: url.searchParams.get('fromDate'),
        toDate: url.searchParams.get('toDate'),
        status: url.searchParams.get('status'),
        search: url.searchParams.get('search'),
      },
      Number(url.searchParams.get('page') || 1),
      Number(url.searchParams.get('limit') || 50)
    );

    return NextResponse.json({ success: true, ...data });
  } catch (err) {
    return financeErrorJson(err, 'Failed to load host earnings report.');
  }
}
