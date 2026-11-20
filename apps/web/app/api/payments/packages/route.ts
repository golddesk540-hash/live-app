import { NextResponse } from 'next/server';
import { webPaymentService } from '@/lib/paymentService';

export async function GET() {
  try {
    const packages = await webPaymentService.getPackages();
    const vipPlans = await webPaymentService.getVipPlans();

    return NextResponse.json({
      success: true,
      packages,
      vipPlans,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch payment packages' },
      { status: 500 }
    );
  }
}
