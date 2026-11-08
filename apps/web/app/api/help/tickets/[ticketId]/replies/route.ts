import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const { ticketId } = params;
    const body = await req.json().catch(() => null);

    if (!body || !body.message || typeof body.message !== 'string' || body.message.trim().length === 0) {
      return NextResponse.json({ error: 'Reply message cannot be empty.' }, { status: 400 });
    }

    const message = body.message.trim();
    const attachmentUrl = body.attachmentUrl || null;

    // Lookup ticket
    const tickets = await query(
      `SELECT id, user_id, email, poppo_id, status FROM popolive.support_tickets WHERE id::text = $1 OR ticket_number = $1 LIMIT 1`,
      [ticketId]
    );

    if (tickets.length === 0) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const ticket = tickets[0];
    const isOwner =
      ticket.user_id === user.id ||
      (ticket.email && ticket.email.toLowerCase() === user.email?.toLowerCase()) ||
      (ticket.poppo_id && ticket.poppo_id === user.poppo_id);

    if (!isOwner) {
      return NextResponse.json({ error: 'Access denied. You do not own this ticket.' }, { status: 403 });
    }

    if (ticket.status === 'closed') {
      return NextResponse.json({ error: 'This ticket is closed and cannot receive replies. Please open a new ticket if you require further assistance.' }, { status: 400 });
    }

    // Insert reply
    const insertRes = await query(
      `INSERT INTO popolive.ticket_replies (
        ticket_id, sender_id, sender_type, sender_name, message, attachment_url
      ) VALUES ($1, $2, 'user', $3, $4, $5)
      RETURNING id, sender_id, sender_type, sender_name, message, attachment_url, created_at`,
      [ticket.id, user.id, user.nickname || 'User', message, attachmentUrl]
    );

    // Update ticket status
    await query(
      `UPDATE popolive.support_tickets SET status = 'open', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [ticket.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Reply sent successfully.',
      reply: insertRes[0],
    });
  } catch (err: any) {
    console.error('Error in POST /api/help/tickets/[ticketId]/replies:', err);
    return NextResponse.json({ error: 'Failed to post reply.' }, { status: 500 });
  }
}
