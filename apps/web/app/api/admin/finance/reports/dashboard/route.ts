import { NextRequest, NextResponse } from 'next/server';
import { getFinanceAdminDashboardMetrics } from '@/lib/financeExport';
import { financeErrorJson, requireAuthorizedFinanceAdmin } from '@/lib/financeRouteHelpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuthorizedFinanceAdmin(req);
    if (!auth.ok) return auth.response;

    const url = new URL(req.url);
    const metrics = await getFinanceAdminDashboardMetrics(auth.actor, {
      preset: url.searchParams.get('preset'),
      fromDate: url.searchParams.get('fromDate'),
      toDate: url.searchParams.get('toDate'),
      currency: url.searchParams.get('currency'),
    });

    return NextResponse.json({ success: true, ...metrics });
  } catch (err) {
    return financeErrorJson(err, 'Failed to compute finance dashboard metrics.');
  }
}
