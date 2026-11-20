import { NextRequest, NextResponse } from 'next/server';
import { adminDeskService } from '@/lib/adminDeskService';
import { authorizeAdminRequest } from '@/lib/adminAuthMiddleware';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await authorizeAdminRequest(req, 'redeem:manage');
    if (!auth.authorized || !auth.actor) {
      return auth.response!;
    }

    const body = await req.json().catch(() => ({}));
    const { code, coinReward, maxUses } = body;

    if (!code || typeof coinReward !== 'number' || typeof maxUses !== 'number') {
      return NextResponse.json(
        { success: false, error: 'code, coinReward, and maxUses are required' },
        { status: 400 }
      );
    }

    const redeemCode = adminDeskService.createRedeemCode(
      auth.actor,
      { code, coinReward, maxUses },
      auth.clientIp
    );

    return NextResponse.json({
      success: true,
      redeemCode,
    });
  } catch (err: any) {
    const status = err.message?.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: err.message },
      { status }
    );
  }
}
