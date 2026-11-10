import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { determinePKTimerState, formatPKTime, formatPKViewers } from '@/lib/pk';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // 1. Initial connection event
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ connectedAt: Date.now(), service: 'pk:discovery' })}\n\n`)
      );

      let lastActiveBattleCount = -1;
      let lastScoresMap = new Map<string, string>();

      const pollState = async () => {
        try {
          // Fetch active battles
          const battles = await query<any>(`
            SELECT id, host_a_nickname, host_b_nickname, host_a_score, host_b_score, viewer_count,
                   remaining_seconds, expires_at, status
            FROM popolive.pk_battles
            WHERE status = 'active'
            ORDER BY is_featured DESC, featured_order ASC, viewer_count DESC
            LIMIT 10;
          `);

          // 2. Broadcast pk:discovery_update if count or state shifted
          if (battles.length !== lastActiveBattleCount) {
            lastActiveBattleCount = battles.length;
            controller.enqueue(
              encoder.encode(
                `event: pk:discovery_update\ndata: ${JSON.stringify({
                  activeBattleCount: battles.length,
                  timestamp: Date.now(),
                })}\n\n`
              )
            );
          }

          // 3. Check for score and timer updates
          for (const b of battles) {
            const scoreKey = `${b.host_a_score}-${b.host_b_score}-${b.viewer_count}`;
            const prevScore = lastScoresMap.get(b.id);

            if (prevScore !== scoreKey) {
              lastScoresMap.set(b.id, scoreKey);

              // Broadcast pk:score_updated
              controller.enqueue(
                encoder.encode(
                  `event: pk:score_updated\ndata: ${JSON.stringify({
                    battleId: b.id,
                    hostAScore: parseInt(b.host_a_score || '0', 10),
                    hostBScore: parseInt(b.host_b_score || '0', 10),
                    viewerCount: b.viewer_count,
                  })}\n\n`
                )
              );

              // Broadcast pk:viewer_count_updated
              controller.enqueue(
                encoder.encode(
                  `event: pk:viewer_count_updated\ndata: ${JSON.stringify({
                    battleId: b.id,
                    viewerCount: b.viewer_count,
                    formatted: formatPKViewers(b.viewer_count),
                  })}\n\n`
                )
              );
            }

            // Timer sync
            if (b.expires_at) {
              const diffMs = new Date(b.expires_at).getTime() - Date.now();
              const remaining = Math.max(0, Math.floor(diffMs / 1000));
              controller.enqueue(
                encoder.encode(
                  `event: pk:timer_sync\ndata: ${JSON.stringify({
                    battleId: b.id,
                    remainingSeconds: remaining,
                    formattedTimer: formatPKTime(remaining),
                    timerStatus: determinePKTimerState(remaining),
                  })}\n\n`
                )
              );
            }
          }

          // Keep-alive ping
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch (err) {
          // Keep stream alive on intermittent errors
        }
      };

      // Run poll every 3 seconds
      const interval = setInterval(pollState, 3000);
      pollState(); // Initial poll

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
