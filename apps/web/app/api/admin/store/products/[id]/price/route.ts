import { NextRequest, NextResponse } from 'next/server';
import { adminDeskService } from '@/lib/adminDeskService';
import { authorizeAdminRequest } from '@/lib/adminAuthMiddleware';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authorizeAdminRequest(req, 'store:manage');
    if (!auth.authorized || !auth.actor) {
      return auth.response!;
    }

    const body = await req.json().catch(() => ({}));
    const { priceCoins } = body;

    if (typeof priceCoins !== 'number') {
      return NextResponse.json(
        { success: false, error: 'priceCoins number is required' },
        { status: 400 }
      );
    }

    const product = adminDeskService.updateStoreProductPrice(
      auth.actor,
      params.id,
      priceCoins,
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
