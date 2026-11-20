import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { webPaymentService } from '@/lib/paymentService';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;
    const authUser = await getAuthenticatedUser(req);
    const userId = authUser?.id || req.nextUrl.searchParams.get('userId') || undefined;

    const result = await webPaymentService.getOrder(orderId, userId);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Order not found.' },
        { status: result.error?.includes('Forbidden') ? 403 : 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order: result.order,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch order.' },
      { status: 500 }
    );
  }
}
