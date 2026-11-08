import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const { ticketId } = params;
    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    // Lookup ticket by UUID or ticket_number
    const tickets = await query(
      `SELECT id, ticket_number, user_id, full_name, email, poppo_id, category, subject, description,
              attachment_url, status, priority, created_at, updated_at
       FROM popolive.support_tickets
       WHERE id::text = $1 OR ticket_number = $1
       LIMIT 1`,
      [ticketId]
    );

    if (tickets.length === 0) {
      return NextResponse.json({ error: 'Support ticket not found.' }, { status: 404 });
    }

    const ticket = tickets[0];

    // Ownership Verification
    const isOwner =
      ticket.user_id === user.id ||
      (ticket.email && ticket.email.toLowerCase() === user.email?.toLowerCase()) ||
      (ticket.poppo_id && ticket.poppo_id === user.poppo_id);

    if (!isOwner) {
      return NextResponse.json({ error: 'Access denied. You do not have permission to view this ticket.' }, { status: 403 });
    }

    // Fetch replies
    const replies = await query(
      `SELECT id, sender_id, sender_type, sender_name, message, attachment_url, created_at
       FROM popolive.ticket_replies
       WHERE ticket_id = $1
       ORDER BY created_at ASC`,
      [ticket.id]
    );

    return NextResponse.json({
      success: true,
      ticket,
      replies,
    });
  } catch (err: any) {
    console.error('Error in GET /api/help/tickets/[ticketId]:', err);
    return NextResponse.json({ error: 'Failed to retrieve ticket details.' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const { ticketId } = params;
    const body = await req.json().catch(() => ({}));
    const { action, status } = body;

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
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // User is closing ticket
    if (action === 'close' || status === 'closed') {
      await query(
        `UPDATE popolive.support_tickets SET status = 'closed', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [ticket.id]
      );

      // System notification reply
      await query(
        `INSERT INTO popolive.ticket_replies (ticket_id, sender_type, sender_name, message)
         VALUES ($1, 'support', 'Popo Live System', 'Ticket marked as Closed by the user.')`,
        [ticket.id]
      );

      return NextResponse.json({ success: true, message: 'Ticket closed successfully', status: 'closed' });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (err: any) {
    console.error('Error in PATCH /api/help/tickets/[ticketId]:', err);
    return NextResponse.json({ error: 'Failed to update ticket.' }, { status: 500 });
  }
}
