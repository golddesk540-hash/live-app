import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { calculatePKScoreRatios, determinePKTimerState, formatPKTime } from '@/lib/pk';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { battleId: string } }
) {
  const battleId = params.battleId;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ battleId, connectedAt: Date.now() })}\n\n`)
      );

      let lastEventId: string | null = null;
      let lastTimerStatus = '';

      const pollState = async () => {
        try {
          const battleRows = await query(
            `SELECT * FROM popolive.pk_battles WHERE id = $1`,
            [battleId]
          );

          if (!battleRows || battleRows.length === 0) return;
          const battle = battleRows[0];

          const now = new Date();
          const expiresAt = battle.expires_at ? new Date(battle.expires_at) : new Date(now.getTime() + 300000);
          const diffMs = expiresAt.getTime() - now.getTime();
          const remainingSeconds = Math.max(0, Math.floor(diffMs / 1000));
          const durationSeconds = battle.duration_seconds || 300;
          const timerStatus = determinePKTimerState(remainingSeconds);

          const scoreA = parseInt(battle.host_a_score || '0', 10);
          const scoreB = parseInt(battle.host_b_score || '0', 10);
          const { ratioA, ratioB } = calculatePKScoreRatios(scoreA, scoreB);

          // 1. Timer sync event
          controller.enqueue(
            encoder.encode(
              `event: pk:timer_sync\ndata: ${JSON.stringify({
                battleId,
                remainingSeconds,
                formattedTime: formatPKTime(remainingSeconds),
                status: timerStatus,
                serverTime: now.toISOString(),
              })}\n\n`
            )
          );

          // 2. Timer warning status change
          if (timerStatus !== lastTimerStatus) {
            lastTimerStatus = timerStatus;
            if (timerStatus === 'warning_60s' || timerStatus === 'warning_10s') {
              controller.enqueue(
                encoder.encode(
                  `event: pk:timer_warning\ndata: ${JSON.stringify({
                    battleId,
                    warningLevel: timerStatus,
                    remainingSeconds,
                  })}\n\n`
                )
              );
            } else if (timerStatus === 'time_expired') {
              controller.enqueue(
                encoder.encode(
                  `event: pk:battle_time_expired\ndata: ${JSON.stringify({
                    battleId,
                    scoreA,
                    scoreB,
                    finalStatus: 'time_expired',
                  })}\n\n`
                )
              );
            }
          }

          // 3. Check for new score events
          const latestEvents = await query(
            `SELECT * FROM popolive.pk_score_events 
             WHERE battle_id = $1 
             ORDER BY created_at DESC 
             LIMIT 1`,
            [battleId]
          );

          if (latestEvents.length > 0 && latestEvents[0].id !== lastEventId) {
            lastEventId = latestEvents[0].id;
            controller.enqueue(
              encoder.encode(
                `event: pk:score_updated\ndata: ${JSON.stringify({
                  battleId,
                  event: latestEvents[0],
                  scoreA,
                  scoreB,
                  ratioA,
                  ratioB,
                })}\n\n`
              )
            );
          }
        } catch (e) {
          // ignore stream error
        }
      };

      // Initial immediate check
      await pollState();

      // Interval ticker every 1000ms
      const interval = setInterval(pollState, 1000);

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
