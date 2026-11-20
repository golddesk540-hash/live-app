import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { webPaymentService } from '@/lib/paymentService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const userId = authUser?.id || req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to view purchase history.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const orders = await webPaymentService.getPurchaseHistory(userId);

    return NextResponse.json({
      success: true,
      orders,
      total: orders.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve purchase history.' },
      { status: 500 }
    );
  }
}
