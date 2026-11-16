import { NextRequest, NextResponse } from 'next/server';
import { resolveMessagingActor, getInboxSummary } from '@/lib/messaging';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const actor = await resolveMessagingActor(req);
    if (!actor) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Cannot subscribe to inbox events.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    let lastEventId = parseInt(
      searchParams.get('lastEventId') || req.headers.get('last-event-id') || '0',
      10
    );
    if (Number.isNaN(lastEventId)) lastEventId = 0;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const summary = await getInboxSummary(actor.id);

          if (lastEventId === 0) {
            const maxRow = await query(
              `SELECT COALESCE(MAX(id), 0) AS max_id
               FROM popolive.messaging_realtime_events
               WHERE recipient_id = $1`,
              [actor.id]
            );
            lastEventId = parseInt(String(maxRow[0]?.max_id ?? '0'), 10);
          }

          controller.enqueue(
            encoder.encode(
              `id: ${lastEventId}\nevent: connected\ndata: ${JSON.stringify({
                service: 'inbox:realtime',
                userId: actor.id,
                summary,
                lastEventId,
                connectedAt: new Date().toISOString(),
              })}\n\n`
            )
          );

          // Polling loop for SSE
          const intervalId = setInterval(async () => {
            try {
              const newEvents = await query(
                `SELECT id, event_type, recipient_id, sender_id, conversation_id, payload, created_at
                 FROM popolive.messaging_realtime_events
                 WHERE recipient_id = $1 AND id > $2
                 ORDER BY id ASC
                 LIMIT 25`,
                [actor.id, lastEventId]
              );

              for (const evt of newEvents) {
                lastEventId = parseInt(String(evt.id), 10);
                controller.enqueue(
                  encoder.encode(
                    `id: ${evt.id}\nevent: ${evt.event_type}\ndata: ${JSON.stringify({
                      eventId: evt.id,
                      eventType: evt.event_type,
                      conversationId: evt.conversation_id,
                      senderId: evt.sender_id,
                      payload: evt.payload,
                      timestamp: evt.created_at,
                    })}\n\n`
                  )
                );
              }

              // Heartbeat ping
              controller.enqueue(
                encoder.encode(`: heartbeat ${new Date().toISOString()}\n\n`)
              );
            } catch (pollErr) {
              console.error('Error polling messaging events:', pollErr);
            }
          }, 1500);

          req.signal.addEventListener('abort', () => {
            clearInterval(intervalId);
            try {
              controller.close();
            } catch (_) {}
          });
        } catch (streamErr) {
          console.error('SSE start error:', streamErr);
          try {
            controller.close();
          } catch (_) {}
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err: any) {
    console.error('Error in GET /api/inbox/events:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
