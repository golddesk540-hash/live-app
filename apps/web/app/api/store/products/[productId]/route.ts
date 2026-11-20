import { NextRequest, NextResponse } from 'next/server';
import { getStoreProductDetail } from '@/lib/storeApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/store/products/:id
 * Returns item detail with price, duration, preview, slot.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params;
    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required.', code: 'INVALID_PRODUCT_ID' },
        { status: 400 }
      );
    }

    const product = await getStoreProductDetail(productId);
    if (!product) {
      return NextResponse.json(
        { success: false, error: `Store product "${productId}" not found.`, code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product,
      item: product, // Alias
    });
  } catch (err: any) {
    console.error('GET /api/store/products/[productId] error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve product details.' },
      { status: err.status || 500 }
    );
  }
}
