import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { getGiftSendingContext } from '@/lib/giftSending';
import { DEFAULT_DEMO_WALLET_USER_ID } from '@/lib/wallet';
import { canAccessPrivateWallet, resolveWalletActor } from '@/lib/walletAuth';

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
  const candidateUserId =
    actor.user?.id ||
    requestedUserId ||
    (actor.actorId !== 'anonymous' ? actor.actorId : isPreviewDemo ? DEFAULT_DEMO_WALLET_USER_ID : null);

  const authorizedPrivateUserId =
    candidateUserId && canAccessPrivateWallet(actor, candidateUserId, isPreviewDemo)
      ? candidateUserId
      : null;

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

      try {
        const ctx = await getGiftSendingContext({
          senderUserId: authorizedPrivateUserId || DEFAULT_DEMO_WALLET_USER_ID,
          roomId,
          pkBattleId,
          canReadPrivateBalance: Boolean(authorizedPrivateUserId),
        });

        if (!requestedScope && (roomId || pkBattleId)) {
          effectiveScope = ctx.roomScope;
        }

        if (cursorId <= 0) {
          const latestRows = await query<{ max_id: string | number | null }>(
            `SELECT COALESCE(MAX(id), 0) AS max_id FROM popolive.gift_realtime_events`
          );
          cursorId = parseInt(String(latestRows[0]?.max_id ?? '0'), 10);
        }

        const recentPublic = await query<any>(
          `SELECT id, event_type, payload, created_at
           FROM popolive.gift_realtime_events
           WHERE ($1 = 'all' OR room_scope = $1)
             AND event_type IN ('gift:received', 'gift:animation_broadcast')
           ORDER BY id DESC
           LIMIT 5`,
          [effectiveScope]
        );

        sendEvent('connected', {
          roomScope: effectiveScope,
          privateBalanceChannelEnabled: Boolean(authorizedPrivateUserId),
          lastEventId: cursorId,
        });

        sendEvent(
          'gift:state_sync',
          {
            roomScope: effectiveScope,
            mode: ctx.mode,
            roomStatus: ctx.roomStatus,
            isLive: ctx.isLive,
            pkBattleId: ctx.pkBattleId,
            pkHostAScore: ctx.pkHostAScore,
            pkHostBScore: ctx.pkHostBScore,
            pkRemainingSeconds: ctx.pkRemainingSeconds,
            senderAvailableCoins: authorizedPrivateUserId ? ctx.senderWallet.availableCoins : null,
            recentGifts: recentPublic.map((r) => r.payload).reverse(),
            lastEventId: cursorId,
          },
          cursorId
        );
      } catch (err: any) {
        sendEvent('error', { message: err?.message || 'Initial sync failed' });
      }

      let heartbeatCounter = 0;
      const timer = setInterval(async () => {
        if (closed) {
          clearInterval(timer);
          return;
        }

        try {
          const rows = await query<{
            id: number;
            room_scope: string;
            sender_user_id: string | null;
            recipient_host_id: string | null;
            event_type: string;
            payload: any;
            created_at: string;
          }>(
            `SELECT id, room_scope, sender_user_id, recipient_host_id, event_type, payload, created_at
             FROM popolive.gift_realtime_events
             WHERE id > $1 AND ($2 = 'all' OR room_scope = $2)
             ORDER BY id ASC
             LIMIT 40`,
            [cursorId, effectiveScope]
          );

          for (const row of rows) {
            cursorId = Math.max(cursorId, parseInt(String(row.id), 10));

            // Strict private vs room-wide channel scoping
            if (
              row.event_type === 'gift:coin_balance_updated' ||
              row.event_type === 'gift:transaction_completed' ||
              row.event_type === 'gift:transaction_failed'
            ) {
              if (!authorizedPrivateUserId || row.sender_user_id !== authorizedPrivateUserId) {
                continue;
              }
            } else if (row.event_type === 'gift:host_points_updated') {
              const isHostViewer =
                authorizedPrivateUserId && row.recipient_host_id === authorizedPrivateUserId;
              if (!isHostViewer && !actor.isFinanceAdmin) {
                continue;
              }
            }

            sendEvent(
              row.event_type,
              {
                ...row.payload,
                eventId: row.id,
                roomScope: row.room_scope,
              },
              row.id
            );
          }

          heartbeatCounter += 1;
          if (heartbeatCounter >= 18) {
            heartbeatCounter = 0;
            if (!closed) {
              controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
            }
          }
        } catch {
          // Non-fatal polling retry
        }
      }, 800);

      req.signal.addEventListener('abort', () => {
        clearInterval(timer);
        closeStream();
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
