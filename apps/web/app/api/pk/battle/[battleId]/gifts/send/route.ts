import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { PKSendRealGiftDto } from '@/lib/pk';
import { processAtomicGiftTransfer } from '@/lib/wallet';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { battleId: string } }
) {
  try {
    const battleId = params.battleId;
    if (!battleId) {
      return NextResponse.json(
        { success: false, error: 'Battle ID is required' },
        { status: 400 }
      );
    }

    const body: PKSendRealGiftDto = await req.json().catch(() => ({}));
    const {
      senderId = 'user_viewer_9001',
      senderName = 'Ali',
      receiverSide = 'host_a',
      giftId,
      quantity = 1,
      idempotencyKey,
    } = body;

    // 1. Validate Battle Status (Completed battles reject new gifts)
    const battleRows = await query<any>(
      `SELECT id, status, host_a_id, host_b_id, host_a_nickname, host_b_nickname, 
              host_a_score, host_b_score, expires_at 
       FROM popolive.pk_battles 
       WHERE id = $1`,
      [battleId]
    );

    if (!battleRows || battleRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'PK Battle not found' },
        { status: 404 }
      );
    }

    const battle = battleRows[0];
    if (battle.status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          error: `Gifts can only be sent during active PK battles. Current status is: ${battle.status}`,
          code: 'BATTLE_ALREADY_ENDED',
        },
        { status: 400 }
      );
    }

    // 2. Validate Receiver Side
    if (receiverSide !== 'host_a' && receiverSide !== 'host_b') {
      return NextResponse.json(
        { success: false, error: 'Receiver side must be host_a or host_b' },
        { status: 400 }
      );
    }

    const receiverId = receiverSide === 'host_a' ? battle.host_a_id : battle.host_b_id;
    const receiverName =
      receiverSide === 'host_a' ? battle.host_a_nickname : battle.host_b_nickname;

    // 3. Validate Gift Catalog Item
    if (!giftId) {
      return NextResponse.json(
        { success: false, error: 'Gift ID is required' },
        { status: 400 }
      );
    }

    const giftRows = await query<any>(
      `SELECT id, name, name_ur, coin_price, image_url, animation_name, is_active 
       FROM popolive.pk_gift_catalog 
       WHERE id = $1 AND is_active = true`,
      [giftId]
    );

    if (!giftRows || giftRows.length === 0) {
      return NextResponse.json(
        { success: false, error: `Gift '${giftId}' not found or inactive` },
        { status: 404 }
      );
    }

    const gift = giftRows[0];
    const qty = Math.max(1, Math.min(999, parseInt(String(quantity || 1), 10)));
    const totalCoins = gift.coin_price * qty;

    // 4. Idempotency Protection Check
    if (idempotencyKey) {
      const existingTx = await query<any>(
        `SELECT * 
         FROM popolive.pk_gift_transactions 
         WHERE idempotency_key = $1`,
        [idempotencyKey]
      );

      if (existingTx && existingTx.length > 0) {
        return NextResponse.json(
          {
            success: true,
            isIdempotentReplay: true,
            transaction: existingTx[0],
            message: 'Transaction already processed previously.',
          },
          { status: 200 }
        );
      }
    }

    // 5. ATOMIC CENTRAL WALLET & POINTS TRANSACTION (Connected to Module 7.1 Wallet Engine)
    const txId = `tx_pk_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const transferRes = await processAtomicGiftTransfer({
      senderId,
      senderName,
      hostUserId: receiverId,
      giftCoins: totalCoins,
      giftName: gift.name,
      isPkBattle: true,
      referenceId: battleId,
      idempotencyKey: idempotencyKey || txId,
    });

    if (!transferRes.success) {
      const avail = transferRes.senderWallet?.coins ?? 0;
      return NextResponse.json(
        {
          success: false,
          error:
            transferRes.error ||
            `Insufficient coin balance. Required: ${totalCoins} coins, available: ${avail} coins.`,
          code: 'INSUFFICIENT_COIN_BALANCE',
          requiredCoins: totalCoins,
          availableCoins: avail,
        },
        { status: 400 }
      );
    }

    const hostPoints = transferRes.hostPointsEarned ?? Math.floor(totalCoins * 0.7);
    const pkScorePoints = totalCoins; // 1 Coin = 1 PK Point
    const remainingCoins = transferRes.senderWallet?.coins ?? 0;

    // Update Authoritative Battle Score on pk_battles
    const scoreUpdateColumn = receiverSide === 'host_a' ? 'host_a_score' : 'host_b_score';
    const scoreUpdateRes = await query<any>(
      `UPDATE popolive.pk_battles
       SET ${scoreUpdateColumn} = ${scoreUpdateColumn} + $1,
           last_synced_at = NOW()
       WHERE id = $2
       RETURNING host_a_score, host_b_score`,
      [pkScorePoints, battleId]
    );

    const updatedScores = scoreUpdateRes[0] || {
      host_a_score: parseInt(battle.host_a_score || '0', 10) + (receiverSide === 'host_a' ? pkScorePoints : 0),
      host_b_score: parseInt(battle.host_b_score || '0', 10) + (receiverSide === 'host_b' ? pkScorePoints : 0),
    };

    // Record into pk_score_events
    await query(
      `INSERT INTO popolive.pk_score_events (
         battle_id, host_side, target_host_id, sender_id, sender_name, points, gift_name, idempotency_key
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        battleId,
        receiverSide,
        receiverId,
        senderId,
        senderName,
        pkScorePoints,
        gift.name,
        idempotencyKey || txId,
      ]
    ).catch(() => {});

    // Record into pk_gift_transactions
    const txInsertRes = await query<any>(
      `INSERT INTO popolive.pk_gift_transactions (
         transaction_id, battle_id, sender_id, sender_name, receiver_id, receiver_name, receiver_side,
         gift_id, gift_name, coin_price, quantity, total_coins, host_points, pk_score_added, status, idempotency_key
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'completed', $15)
       RETURNING *`,
      [
        txId,
        battleId,
        senderId,
        senderName,
        receiverId,
        receiverName,
        receiverSide,
        gift.id,
        gift.name,
        gift.coin_price,
        qty,
        totalCoins,
        hostPoints,
        pkScorePoints,
        idempotencyKey || txId,
      ]
    );

    const txRecord = txInsertRes[0];

    return NextResponse.json({
      success: true,
      transactionId: txRecord.transaction_id,
      battleId,
      sender: { id: senderId, name: senderName, remainingCoins },
      receiver: { id: receiverId, name: receiverName, side: receiverSide },
      gift: {
        id: gift.id,
        name: gift.name,
        nameUr: gift.name_ur,
        coinPrice: gift.coin_price,
        quantity: qty,
        imageUrl: gift.image_url,
        animationName: gift.animation_name,
      },
      financialSummary: {
        totalCoinsDeducted: totalCoins,
        hostEarningsPoints: hostPoints,
        hostSharePercentage: '70%',
      },
      pkScore: {
        pointsAdded: pkScorePoints,
        hostAScore: parseInt(updatedScores.host_a_score || '0', 10),
        hostBScore: parseInt(updatedScores.host_b_score || '0', 10),
      },
      animation: {
        type: gift.animation_name,
        targetSide: receiverSide,
        senderName,
        giftName: gift.name,
      },
    });
  } catch (err: any) {
    console.error('API /api/pk/battle/[battleId]/gifts/send error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal error processing gift transaction' },
      { status: 500 }
    );
  }
}
