import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { getGiftCategories } from '@/lib/giftCatalog';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
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
        const categories = await getGiftCategories({ includeInactive: false });
        if (lastEventId === 0) {
          const latest = await query<{ max_id: string }>(
            `SELECT COALESCE(MAX(id), 0) AS max_id FROM popolive.gift_catalog_realtime_events`
          );
          lastEventId = parseInt(String(latest[0]?.max_id ?? '0'), 10);
        }

        controller.enqueue(
          encoder.encode(
            `id: ${lastEventId}\nevent: connected\ndata: ${JSON.stringify({
              service: 'gift_catalog:realtime',
              lastEventId,
              categoriesCount: categories.length,
              connectedAt: new Date().toISOString(),
            })}\n\n`
          )
        );
      } catch (_) {}

      const pollEvents = async () => {
        try {
          const rows = await query<any>(
            `SELECT id, event_type, payload, created_at
             FROM popolive.gift_catalog_realtime_events
             WHERE id > $1
             ORDER BY id ASC
             LIMIT 25`,
            [lastEventId]
          );

          for (const row of rows) {
            lastEventId = parseInt(String(row.id), 10);
            const payload = typeof row.payload === 'object' ? row.payload : {};
            controller.enqueue(
              encoder.encode(
                `id: ${lastEventId}\nevent: ${row.event_type}\ndata: ${JSON.stringify({
                  eventId: lastEventId,
                  eventType: row.event_type,
                  ...payload,
                })}\n\n`
              )
            );
          }
        } catch (_) {}
      };

      const pollInterval = setInterval(pollEvents, 1500);
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`event: heartbeat\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`)
          );
        } catch (_) {}
      }, 15000);

      req.signal.addEventListener('abort', () => {
        clearInterval(pollInterval);
        clearInterval(heartbeatInterval);
        try {
          controller.close();
        } catch (_) {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
