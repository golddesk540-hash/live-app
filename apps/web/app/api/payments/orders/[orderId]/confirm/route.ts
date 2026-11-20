import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { webPaymentService } from '@/lib/paymentService';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;
    const authUser = await getAuthenticatedUser(req);
    const body = await req.json().catch(() => ({}));
    const userId = authUser?.id || body.userId;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to confirm order.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const result = await webPaymentService.confirmOrder({
      orderId,
      userId,
      providerPaymentRef: body.providerPaymentRef,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to confirm order.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      order: result.order,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to confirm order.' },
      { status: 500 }
    );
  }
}
