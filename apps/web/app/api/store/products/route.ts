import { NextRequest, NextResponse } from 'next/server';
import { getStoreProducts } from '@/lib/storeApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/store/products?category=...&filter=...&search=...
 * Returns product grid for store screen.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const filter = searchParams.get('filter') || undefined;
    const search = searchParams.get('search') || undefined;

    const products = await getStoreProducts({ category, filter, search });

    return NextResponse.json({
      success: true,
      products,
      items: products, // Alias for component flexibility
      count: products.length,
    });
  } catch (err: any) {
    console.error('GET /api/store/products error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to load store products.' },
      { status: err.status || 500 }
    );
  }
}
