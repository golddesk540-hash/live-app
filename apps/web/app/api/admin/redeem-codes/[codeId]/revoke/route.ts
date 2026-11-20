import { NextRequest, NextResponse } from 'next/server';
import { adminDeskService } from '@/lib/adminDeskService';
import { authorizeAdminRequest } from '@/lib/adminAuthMiddleware';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { codeId: string } }
) {
  try {
    const auth = await authorizeAdminRequest(req, 'redeem:manage');
    if (!auth.authorized || !auth.actor) {
      return auth.response!;
    }

    const redeemCode = adminDeskService.revokeRedeemCode(
      auth.actor,
      params.codeId,
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
