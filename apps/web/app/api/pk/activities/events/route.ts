import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { formatActivityCountdown } from '@/lib/pk';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ connectedAt: Date.now(), service: 'pk:activities' })}\n\n`)
      );

      let lastActivityStates = new Map<string, string>();

      const pollState = async () => {
        try {
          const rows = await query<any>(`
            SELECT id, title, status, current_battles, target_battles, starts_at, ends_at
            FROM popolive.pk_activity_slots
            WHERE is_visible = true
            ORDER BY display_order ASC;
          `);

          const now = new Date();

          for (const a of rows) {
            const endsAt = new Date(a.ends_at);
            const remaining = Math.max(0, Math.floor((endsAt.getTime() - now.getTime()) / 1000));
            const stateKey = `${a.status}-${a.current_battles}-${remaining}`;
            const prevState = lastActivityStates.get(a.id);

            if (prevState !== stateKey) {
              lastActivityStates.set(a.id, stateKey);

              controller.enqueue(
                encoder.encode(
                  `event: pk:activity_updated\ndata: ${JSON.stringify({
                    activityId: a.id,
                    title: a.title,
                    status: a.status,
                    currentBattles: a.current_battles,
                    targetBattles: a.target_battles,
                    remainingSeconds: remaining,
                    formattedCountdown: formatActivityCountdown(remaining),
                  })}\n\n`
                )
              );
            }
          }

          // Keep-alive ping
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {}
      };

      const interval = setInterval(pollState, 3000);
      pollState();

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
