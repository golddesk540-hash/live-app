import { NextRequest, NextResponse } from 'next/server';
import { adminDeskService } from '@/lib/adminDeskService';
import { authorizeAdminRequest } from '@/lib/adminAuthMiddleware';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const auth = await authorizeAdminRequest(req, 'chat:moderate');
    if (!auth.authorized || !auth.actor) {
      return auth.response!;
    }

    const body = await req.json().catch(() => ({}));
    const reason = body.reason || 'Reported chat message removed by moderation';

    const message = adminDeskService.deleteReportedMessage(
      auth.actor,
      params.messageId,
      reason,
      auth.clientIp
    );

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (err: any) {
    const status = err.message?.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: err.message },
      { status }
    );
  }
}
