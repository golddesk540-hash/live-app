import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { battleId: string } }
) {
  try {
    const battleId = params.battleId;
    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20', 10));

    const rows = await query<any>(
      `SELECT transaction_id, battle_id, sender_id, sender_name, receiver_id, receiver_name, 
              receiver_side, gift_id, gift_name, coin_price, quantity, total_coins, 
              host_points, pk_score_added, status, created_at
       FROM popolive.pk_gift_transactions
       WHERE battle_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [battleId, limit]
    );

    return NextResponse.json({
      success: true,
      battleId,
      transactions: rows.map((r: any) => ({
        transactionId: r.transaction_id,
        senderId: r.sender_id,
        senderName: r.sender_name,
        receiverId: r.receiver_id,
        receiverName: r.receiver_name,
        receiverSide: r.receiver_side,
        giftId: r.gift_id,
        giftName: r.gift_name,
        coinPrice: r.coin_price,
        quantity: r.quantity,
        totalCoins: r.total_coins,
        hostPoints: r.host_points,
        pkScoreAdded: r.pk_score_added,
        status: r.status,
        createdAt: r.created_at,
      })),
      count: rows.length,
    });
  } catch (err: any) {
    console.error('API /api/pk/battle/[battleId]/gifts/transactions error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve transactions' },
      { status: 500 }
    );
  }
}
