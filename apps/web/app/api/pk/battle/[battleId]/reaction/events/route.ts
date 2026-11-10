import { NextRequest } from 'next/server';
import { query } from '@/lib/db';

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
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ battleId, connectedAt: Date.now(), service: 'pk:reactions' })}\n\n`)
      );

      let lastSeenReactionId: string | null = null;
      let lastTotalCount = -1;

      const pollState = async () => {
        try {
          // Fetch any new reactions since lastSeenReactionId
          let reactionSql = `
            SELECT id, user_id, user_nickname, target_host_side, reaction_type, emoji, created_at
            FROM popolive.pk_reactions
            WHERE battle_id = $1
          `;
          const sqlParams: any[] = [battleId];

          if (lastSeenReactionId) {
            reactionSql += ` AND created_at > (SELECT created_at FROM popolive.pk_reactions WHERE id = $2) ORDER BY created_at ASC LIMIT 10`;
            sqlParams.push(lastSeenReactionId);
          } else {
            reactionSql += ` ORDER BY created_at DESC LIMIT 5`;
          }

          const newReactions = await query<any>(reactionSql, sqlParams);

          if (newReactions.length > 0) {
            const listToBroadcast = lastSeenReactionId ? newReactions : newReactions.reverse();
            for (const r of listToBroadcast) {
              lastSeenReactionId = r.id;
              controller.enqueue(
                encoder.encode(
                  `event: pk:reaction_broadcast\ndata: ${JSON.stringify({
                    id: r.id,
                    battleId,
                    reactionType: r.reaction_type,
                    emoji: r.emoji,
                    targetHostSide: r.target_host_side,
                    userNickname: r.user_nickname,
                    createdAt: r.created_at,
                  })}\n\n`
                )
              );
            }
          }

          // Fetch aggregate counter state
          const countRows = await query<any>(
            `SELECT 
               COUNT(*)::int as total,
               COUNT(CASE WHEN target_host_side = 'host_a' THEN 1 END)::int as host_a_count,
               COUNT(CASE WHEN target_host_side = 'host_b' THEN 1 END)::int as host_b_count
             FROM popolive.pk_reactions
             WHERE battle_id = $1`,
            [battleId]
          );

          const currentTotal = countRows[0]?.total || 0;
          if (currentTotal !== lastTotalCount) {
            lastTotalCount = currentTotal;
            controller.enqueue(
              encoder.encode(
                `event: pk:reaction_counter_updated\ndata: ${JSON.stringify({
                  battleId,
                  total: currentTotal,
                  hostA: countRows[0]?.host_a_count || 0,
                  hostB: countRows[0]?.host_b_count || 0,
                })}\n\n`
              )
            );
          }

          // Keep-alive ping
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {}
      };

      const interval = setInterval(pollState, 2000);
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
