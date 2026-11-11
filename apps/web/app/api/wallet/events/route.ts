import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { DEFAULT_DEMO_WALLET_USER_ID, getWalletSummary } from '@/lib/wallet';
import { canAccessPrivateWallet, resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const isPreviewDemo = searchParams.get('preview') === 'demo';
  const actor = await resolveWalletActor(req);

  const requestedUserId = searchParams.get('userId');
  const targetUserId = requestedUserId || (actor.user ? actor.user.id : DEFAULT_DEMO_WALLET_USER_ID);

  if (!canAccessPrivateWallet(actor, targetUserId, isPreviewDemo)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized: Cannot subscribe to private wallet events of another user.',
        code: 'PRIVATE_WALLET_ACCESS_DENIED',
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
      try {
        // Restore authoritative latest wallet balance immediately on connect/reconnect
        const wallet = await getWalletSummary(targetUserId, true);

        if (lastEventId === 0) {
          const latestRows = await query(
            `SELECT COALESCE(MAX(id), 0) AS max_id
             FROM popolive.wallet_realtime_events
             WHERE user_id = $1`,
            [targetUserId]
          );
          lastEventId = parseInt(String(latestRows[0]?.max_id ?? '0'), 10);
        }

        controller.enqueue(
          encoder.encode(
            `id: ${lastEventId}\nevent: connected\ndata: ${JSON.stringify({
              service: 'wallet:realtime',
              userId: targetUserId,
              restoredWallet: wallet,
              lastEventId,
              connectedAt: new Date().toISOString(),
            })}\n\n`
          )
        );
      } catch (_) {}

      const pollEvents = async () => {
        try {
          const rows = await query(
            `SELECT id, event_type, payload, created_at
             FROM popolive.wallet_realtime_events
             WHERE user_id = $1 AND id > $2
             ORDER BY id ASC
             LIMIT 25`,
            [targetUserId, lastEventId]
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
            encoder.encode(
              `event: heartbeat\ndata: ${JSON.stringify({ ts: Date.now(), userId: targetUserId })}\n\n`
            )
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
