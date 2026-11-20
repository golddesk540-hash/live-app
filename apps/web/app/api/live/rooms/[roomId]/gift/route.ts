import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAuthenticatedUser } from '@/lib/auth';
import { query, withTransaction } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/live/rooms/[roomId]/gift
 * Send a virtual gift to the broadcaster of a live room.
 * Executes an atomic transaction:
 * - Row-level locking on sender wallet (SELECT FOR UPDATE)
 * - Balance verification (coins >= totalCost)
 * - Atomic coin deduction
 * - Locked 70% host revenue share credited to host diamond points
 * - Immutable records in coin_transactions and gift_transactions
 * - Room coins_earned and points_received tally update
 * - Duplicate prevention via idempotency key
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to send gifts.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const roomId = params.roomId;
    const body = await req.json().catch(() => ({}));
    const { giftId, quantity = 1 } = body;
    const idempotencyKey = (body.idempotencyKey || req.headers.get('idempotency-key') || `gift_${user.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`).trim();

    const giftCount = Math.max(1, Math.floor(Number(quantity) || 1));
    if (!giftId) {
      return NextResponse.json(
        { success: false, error: 'Gift ID is required.', code: 'MISSING_GIFT_ID' },
        { status: 400 }
      );
    }

    // 1. Resolve live room and host details
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId);
    const roomRows = await query<any>(
      `SELECT lr.id, lr.room_number, lr.host_id, lr.status, u.nickname AS host_nickname
       FROM popolive.live_rooms lr
       JOIN popolive.users u ON lr.host_id = u.id
       WHERE ${isUuid ? 'lr.id = $1' : 'lr.room_number = $1'}
       LIMIT 1`,
      [roomId]
    );

    if (roomRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Live room not found.', code: 'ROOM_NOT_FOUND' },
        { status: 404 }
      );
    }

    const room = roomRows[0];
    const hostId = room.host_id;

    // Self-gifting check
    if (hostId === user.id) {
      return NextResponse.json(
        { success: false, error: 'Broadcasters cannot send gifts to their own broadcast room.', code: 'SELF_GIFT_DISALLOWED' },
        { status: 400 }
      );
    }

    // 2. Check idempotency: If already executed with this idempotency key, return previous result
    const existingTx = await query<any>(
      `SELECT id, gift_transaction_id, total_coin_amount, host_points_credited, status
       FROM popolive.gift_transactions
       WHERE idempotency_key = $1
       LIMIT 1`,
      [idempotencyKey]
    );

    if (existingTx.length > 0) {
      const tx = existingTx[0];
      const walletRes = await query<any>(
        `SELECT coins, diamond_points FROM popolive.user_wallets WHERE user_id = $1 LIMIT 1`,
        [user.id]
      );
      return NextResponse.json({
        success: true,
        isIdempotentReplay: true,
        message: 'Gift already processed with this transaction token.',
        transactionId: tx.gift_transaction_id,
        coinsDeducted: Number(tx.total_coin_amount),
        hostPointsCredited: Number(tx.host_points_credited),
        remainingCoins: Number(walletRes[0]?.coins || 0),
      });
    }

    // 3. Resolve gift metadata from gift_catalog
    const giftRows = await query<any>(
      `SELECT id, gift_id, name, coin_price, is_active
       FROM popolive.gift_catalog
       WHERE gift_id = $1 OR id::text = $1
       LIMIT 1`,
      [giftId]
    );

    let giftUnitPrice = 10;
    let giftName = 'Gift';
    let resolvedGiftId = giftId;

    if (giftRows.length > 0) {
      giftUnitPrice = Number(giftRows[0].coin_price) || 10;
      giftName = giftRows[0].name || 'Gift';
      resolvedGiftId = giftRows[0].gift_id || giftId;
    }

    const totalCoins = giftUnitPrice * giftCount;

    // 4. Resolve Host Revenue Share: Locked Rule is 70%
    const ruleRows = await query<any>(
      `SELECT rule_value FROM popolive.finance_rules WHERE rule_key = 'host_gift_share_percent' LIMIT 1`
    );
    const hostSharePercent = ruleRows.length > 0 ? Number(ruleRows[0].rule_value) : 70.0;
    const hostPoints = Math.round((totalCoins * hostSharePercent) / 100);
    const platformShare = totalCoins - hostPoints;

    // 5. Execute atomic financial transfer in PostgreSQL
    const transferResult = await withTransaction(async (client) => {
      // Lock sender wallet
      const senderWalletRes = await client.query(
        `SELECT wallet_id, user_id, coins FROM popolive.user_wallets WHERE user_id = $1 FOR UPDATE`,
        [user.id]
      );

      let senderCoins = 0;
      let senderWalletId = null;

      if (senderWalletRes.rows.length === 0) {
        // Initialize wallet if not present
        const initWallet = await client.query(
          `INSERT INTO popolive.user_wallets (wallet_id, user_id, coins, diamond_points, total_spent_coins, total_received_points)
           VALUES (gen_random_uuid(), $1, 0, 0, 0, 0)
           RETURNING wallet_id, coins`,
          [user.id]
        );
        senderCoins = 0;
        senderWalletId = initWallet.rows[0].wallet_id;
      } else {
        senderCoins = Number(senderWalletRes.rows[0].coins);
        senderWalletId = senderWalletRes.rows[0].wallet_id;
      }

      // Verify sufficient balance
      if (senderCoins < totalCoins) {
        throw new Error(`INSUFFICIENT_BALANCE: You need ${totalCoins.toLocaleString()} coins, but your balance is ${senderCoins.toLocaleString()} coins.`);
      }

      const newSenderCoins = senderCoins - totalCoins;

      // Ensure host wallet exists
      await client.query(
        `INSERT INTO popolive.user_wallets (wallet_id, user_id, coins, diamond_points, total_spent_coins, total_received_points)
         VALUES (gen_random_uuid(), $1, 0, 0, 0, 0)
         ON CONFLICT (user_id) DO NOTHING`,
        [hostId]
      );

      // Deduct coins from sender
      await client.query(
        `UPDATE popolive.user_wallets
         SET coins = coins - $1,
             total_spent_coins = total_spent_coins + $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2`,
        [totalCoins, user.id]
      );

      // Credit diamond points to host
      await client.query(
        `UPDATE popolive.user_wallets
         SET diamond_points = diamond_points + $1,
             total_received_points = total_received_points + $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2`,
        [hostPoints, hostId]
      );

      // Record coin debit transaction
      const coinTxId = `ctx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      await client.query(
        `INSERT INTO popolive.coin_transactions (
          id, transaction_id, wallet_id, user_id, transaction_type, direction,
          coin_amount, previous_balance, new_balance, status, reference_id, idempotency_key, description, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, 'gift_sent', 'debit',
          $4, $5, $6, 'completed', $7, $8, $9, CURRENT_TIMESTAMP
        )`,
        [
          coinTxId,
          senderWalletId,
          user.id,
          totalCoins,
          senderCoins,
          newSenderCoins,
          room.id,
          `coin_${idempotencyKey}`,
          `Sent ${giftCount}x ${giftName} to ${room.host_nickname}`,
        ]
      );

      // Record gift transaction with 70% host share snapshot
      const giftTxId = `gtx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      await client.query(
        `INSERT INTO popolive.gift_transactions (
          id, gift_transaction_id, sender_user_id, sender_nickname, recipient_host_id, recipient_nickname,
          live_room_id, gift_id, gift_name_snapshot, gift_price_snapshot, quantity,
          total_coin_amount, host_points_credited, platform_share, share_percentage,
          status, coin_tx_id, idempotency_key, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14,
          'completed', $15, $16, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )`,
        [
          giftTxId,
          user.id,
          user.nickname,
          hostId,
          room.host_nickname,
          room.id,
          resolvedGiftId,
          giftName,
          giftUnitPrice,
          giftCount,
          totalCoins,
          hostPoints,
          platformShare,
          hostSharePercent,
          coinTxId,
          idempotencyKey,
        ]
      );

      // Update room totals
      await client.query(
        `UPDATE popolive.live_rooms
         SET coins_earned = coins_earned + $1,
             points_received = points_received + $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [totalCoins, hostPoints, room.id]
      );

      return {
        giftTxId,
        newSenderCoins,
        hostPoints,
        totalCoins,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Sent ${giftCount}x ${giftName} successfully!`,
      transactionId: transferResult.giftTxId,
      gift: {
        id: resolvedGiftId,
        name: giftName,
        quantity: giftCount,
        unitPrice: giftUnitPrice,
        totalCoins: transferResult.totalCoins,
      },
      hostSharePercent,
      hostPointsCredited: transferResult.hostPoints,
      remainingCoins: transferResult.newSenderCoins,
    });
  } catch (err: any) {
    if (err.message && err.message.startsWith('INSUFFICIENT_BALANCE:')) {
      return NextResponse.json(
        { success: false, error: err.message.replace('INSUFFICIENT_BALANCE: ', ''), code: 'INSUFFICIENT_BALANCE' },
        { status: 400 }
      );
    }
    console.error(`POST /api/live/rooms/${params.roomId}/gift error:`, err);
    return NextResponse.json(
      { success: false, error: 'Failed to process gift transaction.' },
      { status: 500 }
    );
  }
}
