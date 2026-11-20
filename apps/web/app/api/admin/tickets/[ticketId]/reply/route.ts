import { NextRequest, NextResponse } from 'next/server';
import { adminDeskService } from '@/lib/adminDeskService';
import { authorizeAdminRequest } from '@/lib/adminAuthMiddleware';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const auth = await authorizeAdminRequest(req, 'tickets:reply');
    if (!auth.authorized || !auth.actor) {
      return auth.response!;
    }

    const body = await req.json().catch(() => ({}));
    const { message, closeTicket } = body;

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Reply message is required' },
        { status: 400 }
      );
    }

    const ticket = adminDeskService.replyTicket(
      auth.actor,
      params.ticketId,
      message,
      Boolean(closeTicket),
      auth.clientIp
    );

    return NextResponse.json({
      success: true,
      ticket,
    });
  } catch (err: any) {
    const status = err.message?.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: err.message },
      { status }
    );
  }
}
