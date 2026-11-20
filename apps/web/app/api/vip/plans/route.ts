import { NextRequest, NextResponse } from 'next/server';
import { getVipPlans } from '@/lib/vipApiService';
import { listVipBenefitCatalog } from '@/lib/vip';
import { listPaymentProviders } from '@/lib/topup';

export const dynamic = 'force-dynamic';

/**
 * GET /api/vip/plans
 * PART 4 & Test 1: Active VIP membership plans with coin prices and duration
 */
export async function GET(req: NextRequest) {
  try {
    const platform = req.nextUrl.searchParams.get('platform') || undefined;
    const [plans, benefitCatalog, providers] = await Promise.all([
      getVipPlans(),
      listVipBenefitCatalog(false).catch(() => []),
      listPaymentProviders(platform).catch(() => []),
    ]);

    return NextResponse.json({
      success: true,
      plans,
      total: plans.length,
      benefitCatalog,
      providers,
    });
  } catch (err: any) {
    console.error('GET /api/vip/plans error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch VIP plans.' },
      { status: 500 }
    );
  }
}
