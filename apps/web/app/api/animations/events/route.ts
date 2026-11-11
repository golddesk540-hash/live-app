import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { getRoomAnimationStateSync } from '@/lib/animations';
import { resolveRoomStage } from '@/lib/giftSending';
import { DEFAULT_DEMO_WALLET_USER_ID } from '@/lib/wallet';
import { resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId');
  const pkBattleId = searchParams.get('pkBattleId');
  const requestedScope = searchParams.get('roomScope');
  const requestedUserId = searchParams.get('userId');
  const isPreviewDemo = searchParams.get('preview') === 'demo';
  const lastEventIdParam = parseInt(
    searchParams.get('lastEventId') || req.headers.get('last-event-id') || '0',
    10
  );

  const actor = await resolveWalletActor(req);
  const userId =
    actor.user?.id ||
    requestedUserId ||
    (isPreviewDemo ? DEFAULT_DEMO_WALLET_USER_ID : 'anonymous');

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      let cursorId = Number.isFinite(lastEventIdParam) ? lastEventIdParam : 0;

      const sendEvent = (eventName: string, data: any, id?: number | string) => {
        if (closed) return;
        try {
          let chunk = '';
          if (id !== undefined) chunk += `id: ${id}\n`;
          chunk += `event: ${eventName}\n`;
          chunk += `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(chunk));
        } catch {
          closed = true;
        }
      };

      const closeStream = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {}
      };

      req.signal.addEventListener('abort', closeStream);

      let effectiveScope = requestedScope || 'all';
      if (!requestedScope && (roomId || pkBattleId)) {
        try {
          const stage = await resolveRoomStage({
            roomId,
            pkBattleId,
            requireActiveForSend: false,
          });
          effectiveScope = stage.roomScope;
        } catch {
          effectiveScope = pkBattleId ? `pk:${pkBattleId}` : `room:${roomId || '880219'}`;
        }
      }

      try {
        if (cursorId <= 0) {
          const maxRows = await query<{ max_id: string | number | null }>(
            `SELECT COALESCE(MAX(id), 0) AS max_id FROM popolive.animation_realtime_events`
          );
          cursorId = parseInt(String(maxRows[0]?.max_id ?? '0'), 10);
        }

        const syncScope = effectiveScope === 'all' ? 'room:880219' : effectiveScope;
        const stateSync = await getRoomAnimationStateSync({
          roomScope: syncScope,
          userId,
          pkBattleId,
        });

        sendEvent('animation:state_sync', {
          ...stateSync,
          effectiveScope,
          cursorId,
        });

        // Replay missed events if client reconnected with explicit lastEventId
        if (lastEventIdParam > 0) {
          const missed = await query<any>(
            `SELECT id, room_scope, event_type, payload, created_at
             FROM popolive.animation_realtime_events
             WHERE id > $1 AND ($2 = 'all' OR room_scope = $2)
             ORDER BY id ASC
             LIMIT 30`,
            [lastEventIdParam, effectiveScope]
          );
          for (const ev of missed) {
            cursorId = Math.max(cursorId, parseInt(String(ev.id), 10));
            sendEvent(ev.event_type, ev.payload, ev.id);
          }
        }
      } catch (initErr) {
        console.error('Animation SSE init error:', initErr);
        sendEvent('animation:state_sync', {
          roomScope: effectiveScope,
          activeAnimations: [],
          queuedAnimations: [],
          recentEntrances: [],
          syncedAt: new Date().toISOString(),
        });
      }

      const pollTimer = setInterval(async () => {
        if (closed) {
          clearInterval(pollTimer);
          return;
        }
        try {
          const rows = await query<any>(
            `SELECT id, room_scope, event_type, payload, created_at
             FROM popolive.animation_realtime_events
             WHERE id > $1 AND ($2 = 'all' OR room_scope = $2)
             ORDER BY id ASC
             LIMIT 40`,
            [cursorId, effectiveScope]
          );
          for (const row of rows) {
            cursorId = Math.max(cursorId, parseInt(String(row.id), 10));
            sendEvent(row.event_type, row.payload, row.id);
          }
        } catch {}
      }, 450);

      const heartbeatTimer = setInterval(() => {
        if (closed) {
          clearInterval(heartbeatTimer);
          return;
        }
        try {
          controller.enqueue(encoder.encode(`: keepalive ${Date.now()}\n\n`));
        } catch {
          closeStream();
        }
      }, 12000);

      req.signal.addEventListener('abort', () => {
        clearInterval(pollTimer);
        clearInterval(heartbeatTimer);
      });
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
}
