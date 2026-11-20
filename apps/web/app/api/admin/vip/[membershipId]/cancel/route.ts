import { NextRequest, NextResponse } from 'next/server';
import { adminDeskService } from '@/lib/adminDeskService';
import { authorizeAdminRequest } from '@/lib/adminAuthMiddleware';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { membershipId: string } }
) {
  try {
    const auth = await authorizeAdminRequest(req, 'vip:cancel');
    if (!auth.authorized || !auth.actor) {
      return auth.response!;
    }

    const body = await req.json().catch(() => ({}));
    const reason = body.reason || 'VIP membership cancelled by administrative action';

    const membership = adminDeskService.cancelVip(
      auth.actor,
      params.membershipId,
      reason,
      auth.clientIp
    );

    return NextResponse.json({
      success: true,
      membership,
    });
  } catch (err: any) {
    const status = err.message?.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: err.message },
      { status }
    );
  }
}
