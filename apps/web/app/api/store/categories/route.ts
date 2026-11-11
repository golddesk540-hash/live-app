import { NextRequest, NextResponse } from 'next/server';
import { getStoreCategories } from '@/lib/store';
import { storeErrorJson } from '@/lib/storeRouteHelpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const includeInactive = new URL(req.url).searchParams.get('includeInactive') === 'true';
    const categories = await getStoreCategories({ includeInactive });
    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (err: any) {
    return storeErrorJson(err, 'Failed to load store categories.');
  }
}
