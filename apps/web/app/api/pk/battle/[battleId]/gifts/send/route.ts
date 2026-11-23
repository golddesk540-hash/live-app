import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { PKSendRealGiftDto, calculatePKScoreRatios } from '@/lib/pk';
import { processAtomicGiftTransfer } from '@/lib/wallet';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { battleId: string } }
) {
  try {
    const battleId = params.battleId;
    if (!battleId) {
      return NextResponse.json(
        { success: false, error: 'Battle ID is required', code: 'MISSING_BATTLE_ID' },
        { status: 400 }
      );
    }

    const authUser = await getAuthenticatedUser(req);
    const body: PKSendRealGiftDto = await req.json().catch(() => ({}));
    
    // Sender resolution: authenticated session takes priority
    const senderId = authUser?.id || body.senderId || 'user_viewer_9001';
    const senderName = authUser?.nickname || body.senderName || 'Viewer';
    const receiverSide = body.receiverSide || 'host_a';
    const giftId = body.giftId;
    const quantity = body.quantity || 1;
    const idempotencyKey = body.idempotencyKey || req.headers.get('x-idempotency-key') || req.headers.get('idempotency-key');

    // 1. Validate Receiver Side (Strict 1v1 rule)
    if (receiverSide !== 'host_a' && receiverSide !== 'host_b') {
      return NextResponse.json(
        {
          success: false,
          error: 'Unsupported receiver side. Only 1v1 host_a and host_b are supported.',
          code: 'UNSUPPORTED_RECEIVER_SIDE',
        },
        { status: 400 }
      );
    }

    // 2. Fetch PK Battle & Validate 1v1 Restriction and Active Status
    const battleRows = await query<any>(
      `SELECT id, battle_type, status, host_a_id, host_b_id, host_a_nickname, host_b_nickname, 
              host_a_score, host_b_score, expires_at 
       FROM popolive.pk_battles 
       WHERE id = $1`,
      [battleId]
    );

    if (!battleRows || battleRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'PK Battle not found', code: 'BATTLE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const battle = battleRows[0];

    // Enforce 1v1 restriction
    if (battle.battle_type && battle.battle_type !== '1v1') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only 1v1 PK battles are supported. 4-host battles are rejected.',
          code: 'UNSUPPORTED_BATTLE_TYPE',
        },
        { status: 400 }
      );
    }

    // Validate battle status
    if (battle.status !== 'active' && battle.status !== 'confirmed') {
      return NextResponse.json(
        {
          success: false,
          error: `Gifts can only be sent during active PK battles. Current status is: ${battle.status}`,
          code: 'BATTLE_ALREADY_ENDED',
        },
        { status: 400 }
      );
    }

    // Validate battle expiration
    if (battle.expires_at) {
      const expiresAt = new Date(battle.expires_at);
      if (expiresAt.getTime() <= Date.now()) {
        return NextResponse.json(
          {
            success: false,
            error: 'Battle timer has expired. Score contributions are closed.',
            code: 'BATTLE_TIME_EXPIRED',
          },
          { status: 400 }
        );
      }
    }

    const receiverId = receiverSide === 'host_a' ? battle.host_a_id : battle.host_b_id;
    const receiverName =
      receiverSide === 'host_a' ? battle.host_a_nickname : battle.host_b_nickname;

    // Disallow self-gifting
    if (senderId === receiverId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Broadcasters cannot send PK gifts to themselves.',
          code: 'SELF_GIFT_DISALLOWED',
        },
        { status: 400 }
      );
    }

    // 3. Validate Gift Catalog Item
    if (!giftId) {
      return NextResponse.json(
        { success: false, error: 'Gift ID is required', code: 'MISSING_GIFT_ID' },
        { status: 400 }
      );
    }

    let giftRows = await query<any>(
      `SELECT id, name, name_ur, coin_price, image_url, animation_name, is_active 
       FROM popolive.pk_gift_catalog 
       WHERE (id = $1 OR name ILIKE $1) AND is_active = true
       LIMIT 1`,
      [giftId]
    );

    if (!giftRows || giftRows.length === 0) {
      giftRows = await query<any>(
        `SELECT id, gift_id as id, name, name as name_ur, coin_price, image_url, 'banner_flash' as animation_name, is_active
         FROM popolive.gift_catalog
         WHERE (gift_id = $1 OR id::text = $1) AND is_active = true
         LIMIT 1`,
        [giftId]
      );
    }

    if (!giftRows || giftRows.length === 0) {
      return NextResponse.json(
        { success: false, error: `Gift '${giftId}' not found or inactive`, code: 'GIFT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const gift = giftRows[0];
    const qty = Math.max(1, Math.min(999, parseInt(String(quantity || 1), 10)));
    const totalCoins = parseInt(String(gift.coin_price), 10) * qty;
    const effectiveIdempotencyKey = (
      idempotencyKey || `pkgift_${senderId}_${battleId}_${Date.now()}_${Math.random().toString(36).substring(7)}`
    ).trim();

    // 4. Idempotency Protection Check
    if (idempotencyKey) {
      const existingTx = await query<any>(
        `SELECT * 
         FROM popolive.pk_gift_transactions 
         WHERE idempotency_key = $1
         LIMIT 1`,
        [effectiveIdempotencyKey]
      );

      if (existingTx && existingTx.length > 0) {
        const tx = existingTx[0];
        const currentBattle = (
          await query<any>(`SELECT host_a_score, host_b_score FROM popolive.pk_battles WHERE id = $1`, [battleId])
        )[0];

        return NextResponse.json(
          {
            success: true,
            isIdempotentReplay: true,
            transactionId: tx.transaction_id,
            battleId,
            sender: { id: tx.sender_id, name: tx.sender_name },
            receiver: { id: tx.receiver_id, name: tx.receiver_name, side: tx.receiver_side },
            financialSummary: {
              totalCoinsDeducted: tx.total_coins,
              hostEarningsPoints: tx.host_points,
              hostSharePercentage: '70%',
            },
            pkScore: {
              pointsAdded: tx.pk_score_added,
              hostAScore: parseInt(currentBattle?.host_a_score || '0', 10),
              hostBScore: parseInt(currentBattle?.host_b_score || '0', 10),
            },
            message: 'Transaction already processed previously with this token.',
          },
          { status: 200 }
        );
      }
    }

    // 5. ATOMIC CENTRAL WALLET, POINTS, AND PK SCORE TRANSACTION
    const txId = `tx_pk_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const pkScorePoints = totalCoins; // 1 Coin = 1 PK Point authoritative product rule

    let updatedScores = {
      host_a_score: parseInt(battle.host_a_score || '0', 10),
      host_b_score: parseInt(battle.host_b_score || '0', 10),
    };
    let pkGiftTxRecord: any = null;

    const transferRes = await processAtomicGiftTransfer({
      senderId,
      senderName,
      hostUserId: receiverId,
      giftCoins: totalCoins,
      giftName: `${gift.name}${qty > 1 ? ` x${qty}` : ''}`,
      isPkBattle: true,
      referenceId: battleId,
      idempotencyKey: effectiveIdempotencyKey,
      onSuccessInTransaction: async (ctx) => {
        const client = ctx.client;
        const hostPoints = ctx.hostPointsEarned;
        const coinTxId = ctx.coinTxRow.transaction_id;

        // 5a. Lock the battle row inside the transaction to prevent concurrent race conditions
        const bLock = await client.query(
          `SELECT id, status, battle_type, host_a_id, host_b_id, host_a_score, host_b_score, expires_at
           FROM popolive.pk_battles 
           WHERE id = $1 
           FOR UPDATE`,
          [battleId]
        );

        if (bLock.rows.length === 0 || (bLock.rows[0].status !== 'active' && bLock.rows[0].status !== 'confirmed')) {
          const err: any = new Error('BATTLE_ALREADY_ENDED: PK battle ended before gift completed.');
          err.code = 'BATTLE_ALREADY_ENDED';
          err.status = 400;
          throw err;
        }

        const bRow = bLock.rows[0];
        const prevA = parseInt(String(bRow.host_a_score ?? '0'), 10);
        const prevB = parseInt(String(bRow.host_b_score ?? '0'), 10);
        const newScoreA = receiverSide === 'host_a' ? prevA + pkScorePoints : prevA;
        const newScoreB = receiverSide === 'host_b' ? prevB + pkScorePoints : prevB;
        const leadingHostId =
          newScoreA > newScoreB
            ? bRow.host_a_id
            : newScoreB > newScoreA
            ? bRow.host_b_id
            : null;

        // 5b. Atomically update battle scores
        const scoreUpdateRes = await client.query(
          `UPDATE popolive.pk_battles
           SET host_a_score = $1, host_b_score = $2, leading_host_id = $3, last_synced_at = NOW()
           WHERE id = $4
           RETURNING host_a_score, host_b_score`,
          [newScoreA, newScoreB, leadingHostId, battleId]
        );

        updatedScores = scoreUpdateRes.rows[0];

        // 5c. Record into pk_score_events
        await client.query(
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
            `${gift.name}${qty > 1 ? ` x${qty}` : ''}`,
            `pk_score_${effectiveIdempotencyKey}`,
          ]
        );

        // 5d. Record into pk_gift_transactions
        const txInsertRes = await client.query(
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
            effectiveIdempotencyKey,
          ]
        );

        pkGiftTxRecord = txInsertRes.rows[0];

        // 5e. Record persistent gift alert / realtime event
        await client.query(
          `INSERT INTO popolive.gift_realtime_events (
             room_scope, sender_user_id, recipient_host_id, event_type, payload, created_at
           ) VALUES ($1, $2, $3, 'gift:received', $4::jsonb, CURRENT_TIMESTAMP)`,
          [
            `battle:${battleId}`,
            senderId,
            receiverId,
            JSON.stringify({
              transactionId: txId,
              coinTxId,
              battleId,
              receiverSide,
              senderId,
              senderName,
              receiverId,
              receiverName,
              giftId: gift.id,
              giftName: gift.name,
              quantity: qty,
              totalCoins,
              hostPoints,
              pkScoreAdded: pkScorePoints,
              hostAScore: newScoreA,
              hostBScore: newScoreB,
              sentAt: new Date().toISOString(),
            }),
          ]
        );
      },
    });

    if (!transferRes.success) {
      const avail = transferRes.senderWallet?.coins ?? 0;
      return NextResponse.json(
        {
          success: false,
          error:
            transferRes.error ||
            `INSUFFICIENT_COINS: Insufficient coin balance. Required: ${totalCoins} coins, available: ${avail} coins.`,
          code: transferRes.code || 'INSUFFICIENT_COINS',
          requiredCoins: totalCoins,
          availableCoins: avail,
        },
        { status: 400 }
      );
    }

    const hostPoints = transferRes.hostPointsEarned ?? Math.floor(totalCoins * 0.7);
    const remainingCoins = transferRes.senderWallet?.coins ?? 0;

    return NextResponse.json({
      success: true,
      transactionId: pkGiftTxRecord?.transaction_id || txId,
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
        hostAScore: parseInt(String(updatedScores.host_a_score || '0'), 10),
        hostBScore: parseInt(String(updatedScores.host_b_score || '0'), 10),
      },
      animation: {
        type: gift.animation_name || 'banner_flash',
        targetSide: receiverSide,
        senderName,
        giftName: gift.name,
      },
    });
  } catch (err: any) {
    if (err?.code === 'BATTLE_ALREADY_ENDED' || err?.message?.includes('BATTLE_ALREADY_ENDED')) {
      return NextResponse.json(
        { success: false, error: 'Cannot send gift: PK battle has already ended.', code: 'BATTLE_ALREADY_ENDED' },
        { status: 400 }
      );
    }
    console.error('API /api/pk/battle/[battleId]/gifts/send error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal error processing gift transaction', code: err.code || 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
