import { NextRequest, NextResponse } from 'next/server';
import { adminDeskService } from '@/lib/adminDeskService';
import { authorizeAdminRequest } from '@/lib/adminAuthMiddleware';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const auth = await authorizeAdminRequest(req, 'users:unblock');
    if (!auth.authorized || !auth.actor) {
      return auth.response!;
    }

    const user = adminDeskService.unblockUser(
      auth.actor,
      params.userId,
      auth.clientIp
    );

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (err: any) {
    const status = err.message?.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: err.message },
      { status }
    );
  }
}
