import { NextRequest, NextResponse } from 'next/server';
import {
  createFinanceExportJob,
  FinanceExportFormat,
  FinanceReportType,
  listFinanceExportsAndAuditLogs,
} from '@/lib/financeExport';
import { financeErrorJson, requireAuthorizedFinanceAdmin } from '@/lib/financeRouteHelpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuthorizedFinanceAdmin(req);
    if (!auth.ok) return auth.response;

    const url = new URL(req.url);
    const limit = Number(url.searchParams.get('limit') || 30);
    const data = await listFinanceExportsAndAuditLogs(auth.actor, limit);
    return NextResponse.json({ success: true, ...data });
  } catch (err) {
    return financeErrorJson(err, 'Failed to list finance exports and audit logs.');
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuthorizedFinanceAdmin(req);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => ({}));
    const reportType = (body.reportType || 'transactions') as FinanceReportType;
    const exportFormat = (body.exportFormat || 'csv') as FinanceExportFormat;

    const result = await createFinanceExportJob({
      actor: auth.actor,
      reportType,
      exportFormat,
      filters: body.filters || {
        preset: body.preset,
        fromDate: body.fromDate,
        toDate: body.toDate,
        txCategory: body.txCategory,
        status: body.status,
        paymentMethod: body.paymentMethod,
        currency: body.currency,
        search: body.search,
      },
      idempotencyKey: body.idempotencyKey || req.headers.get('idempotency-key'),
      ttlSeconds: typeof body.ttlSeconds === 'number' ? body.ttlSeconds : undefined,
    });

    return NextResponse.json({ success: true, exportJob: result }, { status: 201 });
  } catch (err) {
    return financeErrorJson(err, 'Failed to generate finance export.');
  }
}
