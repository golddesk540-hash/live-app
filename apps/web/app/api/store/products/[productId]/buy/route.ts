import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { buyStoreProductAtomic } from '@/lib/storeApiService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/store/products/:id/buy
 * Atomically debits coins via P7-P7 ledger, creates inventory row, checks duplicate ownership.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to purchase store products.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { productId } = params;
    const body = await req.json().catch(() => ({}));
    const autoEquip = Boolean(body.autoEquip);
    const idempotencyKey =
      req.headers.get('x-idempotency-key') ||
      (typeof body.idempotencyKey === 'string' ? body.idempotencyKey : null);

    const result = await buyStoreProductAtomic({
      user,
      productId,
      autoEquip,
      idempotencyKey,
    });

    return NextResponse.json({
      success: true,
      deduplicated: Boolean(result.deduplicated),
      purchase: result.purchase,
      inventory: result.inventory,
      wallet: result.wallet,
    });
  } catch (err: any) {
    if (err.code === 'AGE_RESTRICTION_18_PLUS') {
      return NextResponse.json(
        { success: false, error: err.message, code: 'AGE_RESTRICTION_18_PLUS' },
        { status: 403 }
      );
    }
    if (err.code === 'DUPLICATE_OWNERSHIP') {
      return NextResponse.json(
        { success: false, error: err.message, code: 'DUPLICATE_OWNERSHIP' },
        { status: 409 }
      );
    }
    if (err.code === 'INSUFFICIENT_COINS') {
      return NextResponse.json(
        { success: false, error: err.message, code: 'INSUFFICIENT_COINS' },
        { status: 400 }
      );
    }

    console.error('POST /api/store/products/[productId]/buy error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Store purchase failed.', code: err.code || 'PURCHASE_FAILED' },
      { status: err.status || 500 }
    );
  }
}
