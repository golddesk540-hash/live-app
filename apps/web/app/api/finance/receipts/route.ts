import { NextRequest, NextResponse } from 'next/server';
import { listUserReceipts } from '@/lib/receipts';
import { financeErrorJson, resolveFinanceUserScope } from '@/lib/financeRouteHelpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const scope = await resolveFinanceUserScope(req);
    if (!scope.ok) return scope.response;

    const url = new URL(req.url);
    const data = await listUserReceipts({
      userId: scope.targetUserId,
      txCategory: url.searchParams.get('category') || url.searchParams.get('type'),
      status: url.searchParams.get('status'),
      search: url.searchParams.get('search'),
      preset: url.searchParams.get('preset'),
      fromDate: url.searchParams.get('fromDate'),
      toDate: url.searchParams.get('toDate'),
      page: Number(url.searchParams.get('page') || 1),
      limit: Number(url.searchParams.get('limit') || 20),
    });

    return NextResponse.json({ success: true, isPreviewDemo: scope.isPreviewDemo, ...data });
  } catch (err) {
    return financeErrorJson(err, 'Failed to load user financial receipts.');
  }
}

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      errorCode: 'RECEIPT_FORGERY_FORBIDDEN',
      error: 'Forbidden: Financial receipts are immutable server-generated records and cannot be submitted by clients.',
    },
    { status: 403 }
  );
}
