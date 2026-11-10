import { NextRequest } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hostId = searchParams.get('hostId') || '';
  const roomNumber = searchParams.get('roomNumber') || '';

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection event
      controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({ time: Date.now(), hostId })}\n\n`));

      const interval = setInterval(async () => {
        try {
          // Check for any incoming pending invitations
          if (hostId || roomNumber) {
            const inviteRows = await query(
              `SELECT * FROM popolive.pk_invitations 
               WHERE (receiver_host_id = $1 OR receiver_room_number = $2)
                 AND status = 'pending' AND expires_at > NOW()
               ORDER BY created_at DESC LIMIT 1`,
              [hostId, roomNumber]
            );

            if (inviteRows.length > 0) {
              const invite = inviteRows[0];
              const secondsRemaining = Math.max(0, Math.floor((new Date(invite.expires_at).getTime() - Date.now()) / 1000));
              controller.enqueue(encoder.encode(`event: incoming_invitation\ndata: ${JSON.stringify({ ...invite, secondsRemaining })}\n\n`));
            }
          }

          // Keep-alive ping
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch (err) {
          // Continue stream on intermittent error
        }
      }, 3000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
