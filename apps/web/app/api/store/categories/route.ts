import { NextRequest, NextResponse } from 'next/server';
import { getStoreCategories, USE_STORE_API } from '@/lib/storeApiService';
import { getStoreCategories as getStoreCategoriesLegacy } from '@/lib/store';
import { storeErrorJson } from '@/lib/storeRouteHelpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    if (USE_STORE_API) {
      const categories = await getStoreCategories();
      return NextResponse.json({
        success: true,
        categories,
      });
    }

    const includeInactive = new URL(req.url).searchParams.get('includeInactive') === 'true';
    const categories = await getStoreCategoriesLegacy({ includeInactive });
    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (err: any) {
    return storeErrorJson(err, 'Failed to load store categories.');
  }
}
