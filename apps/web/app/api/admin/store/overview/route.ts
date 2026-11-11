import { NextRequest, NextResponse } from 'next/server';
import { adminGetStoreOverview } from '@/lib/store';
import { requireStoreFinanceAdmin, storeErrorJson } from '@/lib/storeRouteHelpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireStoreFinanceAdmin(req);
    if (!auth.ok) return auth.response;

    const search = new URL(req.url).searchParams.get('search') || '';
    const overview = await adminGetStoreOverview(search);
    return NextResponse.json({
      success: true,
      ...overview,
    });
  } catch (err: any) {
    return storeErrorJson(err, 'Failed to load admin store overview.');
  }
}
