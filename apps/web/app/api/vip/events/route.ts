import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  resolveActiveUserVipProfile,
  resolveCanonicalVipUserId,
  resolveVipTargetUser,
} from '@/lib/vip';
import { resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const isPreviewDemo = searchParams.get('preview') === 'demo';
  const actor = await resolveWalletActor(req);
  const target = resolveVipTargetUser(actor, searchParams.get('userId'), isPreviewDemo);

  if (!target.allowed) {
    return NextResponse.json(
      { success: false, errorCode: target.errorCode, error: target.error },
      { status: target.statusCode }
    );
  }

  const canonicalUserId = await resolveCanonicalVipUserId(target.userId);
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
        const vipProfile = await resolveActiveUserVipProfile(canonicalUserId, {
          includePendingOrder: true,
        });
        if (lastEventId === 0) {
          const maxRows = await query(
            `SELECT COALESCE(MAX(id), 0) AS max_id
             FROM popolive.vip_realtime_events
             WHERE user_id = $1`,
            [canonicalUserId]
          );
          lastEventId = parseInt(String(maxRows[0]?.max_id ?? '0'), 10);
        }

        controller.enqueue(
          encoder.encode(
            `id: ${lastEventId}\nevent: vip:state_sync\ndata: ${JSON.stringify({
              userId: canonicalUserId,
              vip: vipProfile,
              syncedAt: new Date().toISOString(),
            })}\n\n`
          )
        );
      } catch (err) {
        console.error('VIP SSE init error:', err);
      }

      const pollInterval = setInterval(async () => {
        if (closed) return;
        try {
          const rows = await query(
            `SELECT id, event_name, payload, created_at
             FROM popolive.vip_realtime_events
             WHERE user_id = $1 AND id > $2
             ORDER BY id ASC
             LIMIT 25`,
            [canonicalUserId, lastEventId]
          );

          for (const row of rows) {
            const eventId = parseInt(String(row.id), 10);
            if (eventId > lastEventId) lastEventId = eventId;
            const payload =
              typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload || {};
            controller.enqueue(
              encoder.encode(
                `id: ${eventId}\nevent: ${row.event_name}\ndata: ${JSON.stringify(payload)}\n\n`
              )
            );
          }
        } catch (err) {
          console.error('VIP SSE poll error:', err);
        }
      }, 400);

      const keepAlive = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`: keepalive ${Date.now()}\n\n`));
        } catch {
          // ignore
        }
      }, 15000);

      req.signal.addEventListener('abort', () => {
        closed = true;
        clearInterval(pollInterval);
        clearInterval(keepAlive);
        try {
          controller.close();
        } catch {
          // ignore
        }
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
