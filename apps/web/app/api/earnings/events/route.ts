import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  DEFAULT_PREVIEW_HOST_ID,
  canAccessHostEarnings,
  getHostEarningsDashboard,
} from '@/lib/hostEarnings';
import { resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const isPreviewDemo = searchParams.get('preview') === 'demo';
  const actor = await resolveWalletActor(req);

  const requestedHostId = searchParams.get('hostUserId') || searchParams.get('userId');
  const targetHostId = requestedHostId || (actor.user ? actor.user.id : DEFAULT_PREVIEW_HOST_ID);

  if (!canAccessHostEarnings(actor, targetHostId, isPreviewDemo)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized: Cannot subscribe to another host private earnings events.',
        code: 'EARNINGS_ACCESS_DENIED',
      },
      { status: 403 }
    );
  }

  let lastEventId = parseInt(
    searchParams.get('lastEventId') || req.headers.get('last-event-id') || '0',
    10
  );
  if (Number.isNaN(lastEventId)) lastEventId = 0;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      try {
        const dashboard = await getHostEarningsDashboard(targetHostId, { fresh: true });
        if (lastEventId === 0) {
          const latestRows = await query(
            `SELECT COALESCE(MAX(id), 0) AS max_id
             FROM popolive.earnings_realtime_events
             WHERE host_user_id = $1`,
            [targetHostId]
          );
          lastEventId = parseInt(String(latestRows[0]?.max_id ?? '0'), 10);
        }

        controller.enqueue(
          encoder.encode(
            `id: ${lastEventId}\nevent: earnings:state_sync\ndata: ${JSON.stringify({
              service: 'earnings:realtime',
              hostUserId: targetHostId,
              dashboard,
              lastEventId,
              connectedAt: new Date().toISOString(),
            })}\n\n`
          )
        );
      } catch (_) {}

      const pollEvents = async () => {
        if (closed) return;
        try {
          const rows = await query(
            `SELECT id, event_type, payload, created_at
             FROM popolive.earnings_realtime_events
             WHERE host_user_id = $1 AND id > $2
             ORDER BY id ASC
             LIMIT 25`,
            [targetHostId, lastEventId]
          );

          for (const row of rows) {
            if (closed) break;
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

      const pollTimer = setInterval(pollEvents, 400);
      const heartbeatTimer = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`: keepalive ${Date.now()}\n\n`));
        } catch (_) {}
      }, 15000);

      req.signal.addEventListener('abort', () => {
        closed = true;
        clearInterval(pollTimer);
        clearInterval(heartbeatTimer);
        try {
          controller.close();
        } catch (_) {}
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
