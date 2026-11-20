import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { sendTicketMessage } from '@/lib/finalApiService';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const { ticketId } = params;
    const body = await req.json();

    if (!body.message || typeof body.message !== 'string' || body.message.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Message cannot be empty.' }, { status: 400 });
    }

    const reply = await sendTicketMessage(user, ticketId, body.message.trim(), body.attachmentUrl);
    return NextResponse.json({
      success: true,
      message: reply,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message, code: err.code || 'SEND_MESSAGE_ERROR' },
      { status: err.status || 500 }
    );
  }
}
