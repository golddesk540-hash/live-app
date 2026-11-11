import { NextRequest, NextResponse } from 'next/server';
import { getVipPlanById } from '@/lib/vip';
import { vipErrorJson } from '@/lib/vipRouteHelpers';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    const plan = await getVipPlanById(params.planId, { includeInactive: false });
    return NextResponse.json({ success: true, module: '7.7', plan });
  } catch (err: any) {
    return vipErrorJson(err, 'Failed to load VIP plan details.');
  }
}
