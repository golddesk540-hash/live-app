import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { getUserEquippedStoreLoadout } from '@/lib/store';
import { resolveStoreUserScope } from '@/lib/storeRouteHelpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const scope = await resolveStoreUserScope(req);
  if (!scope.ok) return scope.response;
  if (!scope.targetUserId) {
    return new Response(JSON.stringify({ success: false, error: 'Authentication required.' }), { status: 401 });
  }

  const userId = scope.targetUserId;
  const encoder = new TextEncoder();
  let lastSeenId = 0;

  try {
    const latest = await query<any>(
      `SELECT COALESCE(MAX(id), 0)::bigint AS max_id
       FROM popolive.store_realtime_events
       WHERE user_id = $1 OR user_id = '*'`,
      [userId]
    );
    lastSeenId = parseInt(String(latest[0]?.max_id ?? '0'), 10);
  } catch {
    lastSeenId = 0;
  }

  let closed = false;
  let timer: ReturnType<typeof setInterval> | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: any) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };

      try {
        const equipped = await getUserEquippedStoreLoadout(userId);
        send('store:state_sync', { userId, equipped, timestamp: new Date().toISOString() });
      } catch {
        send('store:state_sync', { userId, equipped: null, timestamp: new Date().toISOString() });
      }

      timer = setInterval(async () => {
        if (closed) return;
        try {
          const rows = await query<any>(
            `SELECT id, user_id, event_name, payload, created_at
             FROM popolive.store_realtime_events
             WHERE (user_id = $1 OR user_id = '*') AND id > $2
             ORDER BY id ASC LIMIT 25`,
            [userId, lastSeenId]
          );
          for (const row of rows) {
            const rowId = parseInt(String(row.id), 10);
            if (rowId > lastSeenId) lastSeenId = rowId;
            send(row.event_name, row.payload);
          }
        } catch {
          // ignore transient poll failure
        }
      }, 400);

      heartbeat = setInterval(() => {
        if (!closed) {
          try {
            controller.enqueue(encoder.encode(': heartbeat\n\n'));
          } catch {
            closed = true;
          }
        }
      }, 15000);
    },
    cancel() {
      closed = true;
      if (timer) clearInterval(timer);
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  req.signal.addEventListener('abort', () => {
    closed = true;
    if (timer) clearInterval(timer);
    if (heartbeat) clearInterval(heartbeat);
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
