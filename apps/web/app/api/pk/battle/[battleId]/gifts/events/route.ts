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
        encoder.encode(
          `event: connected\ndata: ${JSON.stringify({
            battleId,
            connectedAt: Date.now(),
            service: 'pk:gifts:events',
          })}\n\n`
        )
      );

      let lastSeenTxId: string | null = null;

      const pollGifts = async () => {
        try {
          let sql = `
            SELECT id, transaction_id, sender_id, sender_name, receiver_id, receiver_name,
                   receiver_side, gift_id, gift_name, coin_price, quantity, total_coins,
                   host_points, pk_score_added, status, created_at
            FROM popolive.pk_gift_transactions
            WHERE battle_id = $1
          `;
          const sqlParams: any[] = [battleId];

          if (lastSeenTxId) {
            sql += ` AND created_at > (SELECT created_at FROM popolive.pk_gift_transactions WHERE transaction_id = $2) ORDER BY created_at ASC LIMIT 10`;
            sqlParams.push(lastSeenTxId);
          } else {
            sql += ` ORDER BY created_at DESC LIMIT 3`;
          }

          const newTxs = await query<any>(sql, sqlParams);

          if (newTxs.length > 0) {
            const list = lastSeenTxId ? newTxs : newTxs.reverse();
            for (const tx of list) {
              lastSeenTxId = tx.transaction_id;
              controller.enqueue(
                encoder.encode(
                  `event: pk:gift_animation\ndata: ${JSON.stringify({
                    transactionId: tx.transaction_id,
                    battleId,
                    senderName: tx.sender_name,
                    receiverName: tx.receiver_name,
                    receiverSide: tx.receiver_side,
                    giftId: tx.gift_id,
                    giftName: tx.gift_name,
                    quantity: tx.quantity,
                    totalCoins: tx.total_coins,
                    pkScoreAdded: tx.pk_score_added,
                    createdAt: tx.created_at,
                  })}\n\n`
                )
              );
            }
          }
        } catch (_) {}
      };

      const interval = setInterval(pollGifts, 2000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
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
    },
  });
}
