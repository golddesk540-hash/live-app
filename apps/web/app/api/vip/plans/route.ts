import { NextRequest, NextResponse } from 'next/server';
import { listPaymentProviders } from '@/lib/topup';
import { listVipBenefitCatalog, listVipPlans } from '@/lib/vip';
import { vipErrorJson } from '@/lib/vipRouteHelpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const platform = req.nextUrl.searchParams.get('platform') || undefined;
    const [plans, benefitCatalog, providers] = await Promise.all([
      listVipPlans({ includeInactive: false }),
      listVipBenefitCatalog(false),
      listPaymentProviders(platform),
    ]);

    return NextResponse.json({
      success: true,
      module: '7.7',
      plans,
      benefitCatalog,
      providers,
    });
  } catch (err: any) {
    console.error('GET /api/vip/plans error:', err);
    return vipErrorJson(err, 'Failed to fetch VIP plans.');
  }
}
