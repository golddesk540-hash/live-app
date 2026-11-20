import { NextRequest, NextResponse } from 'next/server';
import { adminDeskService } from '@/lib/adminDeskService';
import { authorizeAdminRequest } from '@/lib/adminAuthMiddleware';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authorizeAdminRequest(req, 'withdrawals:moderate');
    if (!auth.authorized || !auth.actor) {
      return auth.response!;
    }

    const body = await req.json().catch(() => ({}));
    const reason = body.reason || 'Withdrawal rejected by finance team';

    const withdrawal = adminDeskService.rejectWithdrawal(
      auth.actor,
      params.id,
      reason,
      auth.clientIp
    );

    return NextResponse.json({
      success: true,
      withdrawal,
    });
  } catch (err: any) {
    const status = err.message?.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: err.message },
      { status }
    );
  }
}
