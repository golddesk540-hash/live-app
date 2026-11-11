import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { canAccessTopupUser } from '@/lib/topup';
import { DEFAULT_DEMO_WALLET_USER_ID, getWalletSummary } from '@/lib/wallet';
import { resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const isPreviewDemo = searchParams.get('preview') === 'demo';
  const actor = await resolveWalletActor(req);

  const requestedUserId = searchParams.get('userId')?.trim();
  const targetUserId =
    requestedUserId ||
    (actor.user ? actor.user.id : isPreviewDemo ? DEFAULT_DEMO_WALLET_USER_ID : '');

  if (!targetUserId || !canAccessTopupUser(actor, targetUserId, isPreviewDemo)) {
    return NextResponse.json(
      {
        success: false,
        errorCode: 'TOPUP_ACCESS_DENIED',
        error: 'Unauthorized: Cannot subscribe to another user top-up events.',
      },
      { status: actor.actorId === 'anonymous' && !isPreviewDemo ? 401 : 403 }
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
        const wallet = await getWalletSummary(targetUserId, true);
        if (lastEventId === 0) {
          const maxRows = await query(
            `SELECT COALESCE(MAX(id), 0) AS max_id
             FROM popolive.topup_realtime_events
             WHERE user_id = $1`,
            [targetUserId]
          );
          lastEventId = parseInt(String(maxRows[0]?.max_id ?? '0'), 10);
        }

        controller.enqueue(
          encoder.encode(
            `id: ${lastEventId}\nevent: wallet:topup_state_sync\ndata: ${JSON.stringify({
              service: 'topup:realtime',
              userId: targetUserId,
              wallet,
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
            `SELECT id, event_name, payload
             FROM popolive.topup_realtime_events
             WHERE user_id = $1 AND id > $2
             ORDER BY id ASC
             LIMIT 25`,
            [targetUserId, lastEventId]
          );

          for (const row of rows) {
            if (closed) break;
            lastEventId = parseInt(String(row.id), 10);
            const payload = typeof row.payload === 'object' ? row.payload : {};
            controller.enqueue(
              encoder.encode(
                `id: ${lastEventId}\nevent: ${row.event_name}\ndata: ${JSON.stringify({
                  eventId: lastEventId,
                  eventName: row.event_name,
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
