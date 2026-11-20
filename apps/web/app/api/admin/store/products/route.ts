import { NextRequest, NextResponse } from 'next/server';
import { adminDeskService } from '@/lib/adminDeskService';
import { authorizeAdminRequest } from '@/lib/adminAuthMiddleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const products = adminDeskService.listStoreProducts();
    return NextResponse.json({
      success: true,
      products,
      total: products.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeAdminRequest(req, 'store:manage');
    if (!auth.authorized || !auth.actor) {
      return auth.response!;
    }

    const body = await req.json().catch(() => ({}));
    const { sku, name, category, priceCoins } = body;

    if (!sku || !name || !category || typeof priceCoins !== 'number') {
      return NextResponse.json(
        { success: false, error: 'sku, name, category, and priceCoins are required' },
        { status: 400 }
      );
    }

    const product = adminDeskService.addStoreProduct(
      auth.actor,
      { sku, name, category, priceCoins },
      auth.clientIp
    );

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (err: any) {
    const status = err.message?.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: err.message },
      { status }
    );
  }
}
