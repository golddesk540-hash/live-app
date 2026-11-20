import crypto from 'crypto';
import { query, withTransaction } from '@/lib/db';
import { AuthUser, calculateAge, isStaffMember } from '@/lib/auth';

/**
 * POPO LIVE — PHASE 7 (P7-P7)
 * ECONOMY MODULE CENTRAL SERVICE & LOCKED RULES ENGINE
 * Single authoritative service for Coins, Points, Packages, Gifts & Transactions
 */

export const USE_ECONOMY_API: boolean = process.env.NEXT_PUBLIC_USE_ECONOMY_API !== 'false';

export interface WalletRecord {
  walletId: string;
  userId: string;
  coins: number;
  diamondPoints: number;
  totalSpentCoins: number;
  totalReceivedPoints: number;
  isFrozen: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CoinPackageItem {
  id: string;
  packageId: string;
  name: string;
  nameUr: string | null;
  baseCoins: number;
  bonusCoins: number;
  totalCoins: number;
  priceAmount: number;
  currency: string;
  iconUrl: string;
  badgeText: string | null;
  isPopular: boolean;
  isActive: boolean;
  displayOrder: number;
}

export interface GiftCatalogItem {
  id: string;
  giftId: string;
  name: string;
  coinPrice: number;
  iconUrl: string;
  animationType: string;
  isActive: boolean;
}

/**
 * LOCKED RULE 1: Server-Side Age 18+ Verification
 * Reject access to economy and wallet features for users under 18 years of age.
 */
export function assertAdultEconomy(user: AuthUser, actionName: string = 'access economy and wallet services'): void {
  if (user.is_adult_verified) return;

  if (user.birthdate) {
    const age = calculateAge(user.birthdate);
    if (age < 18) {
      const error: any = new Error(
        `AGE_RESTRICTION_18_PLUS: You must be at least 18 years old to ${actionName}. Current age: ${age}.`
      );
      error.code = 'AGE_RESTRICTION_18_PLUS';
      error.status = 403;
      throw error;
    }
  } else if (user.is_adult_verified === false) {
    const error: any = new Error(
      `AGE_RESTRICTION_18_PLUS: User age verification required. Underage accounts cannot ${actionName}.`
    );
    error.code = 'AGE_RESTRICTION_18_PLUS';
    error.status = 403;
    throw error;
  }
}

/**
 * Retrieves or safely initializes a user's wallet in popolive.user_wallets
 */
export async function getOrCreateUserWallet(userId: string, client?: any): Promise<WalletRecord> {
  const queryFn = client ? client.query.bind(client) : query;

  let res = await queryFn(
    `SELECT wallet_id, user_id, coins, diamond_points, total_spent_coins, total_received_points, is_frozen, created_at, updated_at
     FROM popolive.user_wallets
     WHERE user_id = $1
     LIMIT 1`,
    [userId]
  );

  const rows = client ? (res.rows || []) : res;
  if (rows.length === 0) {
    const insertRes = await queryFn(
      `INSERT INTO popolive.user_wallets (
        wallet_id, user_id, coins, diamond_points, total_spent_coins, total_received_points, is_frozen, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, 0, 0, 0, 0, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) ON CONFLICT (user_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
      RETURNING wallet_id, user_id, coins, diamond_points, total_spent_coins, total_received_points, is_frozen, created_at, updated_at`,
      [userId]
    );
    const created = client ? (insertRes.rows[0]) : insertRes[0];
    return {
      walletId: created.wallet_id,
      userId: created.user_id,
      coins: Number(created.coins) || 0,
      diamondPoints: Number(created.diamond_points) || 0,
      totalSpentCoins: Number(created.total_spent_coins) || 0,
      totalReceivedPoints: Number(created.total_received_points) || 0,
      isFrozen: Boolean(created.is_frozen),
      createdAt: created.created_at ? new Date(created.created_at).toISOString() : new Date().toISOString(),
      updatedAt: created.updated_at ? new Date(created.updated_at).toISOString() : new Date().toISOString(),
    };
  }

  const r = rows[0];
  return {
    walletId: r.wallet_id,
    userId: r.user_id,
    coins: Number(r.coins) || 0,
    diamondPoints: Number(r.diamond_points) || 0,
    totalSpentCoins: Number(r.total_spent_coins) || 0,
    totalReceivedPoints: Number(r.total_received_points) || 0,
    isFrozen: Boolean(r.is_frozen),
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
  };
}

/**
 * Fetches active coin packages (Read-Only Display)
 * LOCKED RULE 8: Coin packages remain display-only in this prompt — no real purchases.
 */
export async function getCoinPackages(): Promise<CoinPackageItem[]> {
  const rows = await query<any>(
    `SELECT id, package_id, package_name, package_name_ur, base_coins, bonus_coins,
            total_coins, price_amount, currency, icon_url, badge_text, is_popular, is_active, display_order
     FROM popolive.coin_packages
     WHERE is_active = true
     ORDER BY display_order ASC`
  );

  return rows.map((r) => ({
    id: r.id,
    packageId: r.package_id,
    name: r.package_name,
    nameUr: r.package_name_ur,
    baseCoins: Number(r.base_coins),
    bonusCoins: Number(r.bonus_coins || 0),
    totalCoins: Number(r.total_coins),
    priceAmount: Number(r.price_amount),
    currency: r.currency || 'USD',
    iconUrl: r.icon_url || '/assets/gifts/07_06_top_up.png',
    badgeText: r.badge_text,
    isPopular: Boolean(r.is_popular),
    isActive: Boolean(r.is_active),
    displayOrder: Number(r.display_order || 0),
  }));
}

/**
 * Fetches active gift catalogue
 */
export async function getGiftsCatalog(): Promise<GiftCatalogItem[]> {
  const rows = await query<any>(
    `SELECT id, gift_id, name, coin_price,
            COALESCE(image_url, thumbnail_url, '/assets/gifts/07_03_rose.png') as icon_url,
            COALESCE(asset_type, 'svga') as animation_type, is_active
     FROM popolive.gift_catalog
     WHERE is_active = true
     ORDER BY coin_price ASC, display_order ASC`
  );

  return rows.map((r) => ({
    id: r.id,
    giftId: r.gift_id,
    name: r.name,
    coinPrice: Number(r.coin_price),
    iconUrl: r.icon_url || '/assets/gifts/07_03_rose.png',
    animationType: r.animation_type || 'svga',
    isActive: Boolean(r.is_active),
  }));
}

/**
 * Fetches paginated coin transaction history for a user
 * LOCKED RULE 7: Points and coins are separate ledgers — never mix.
 */
export async function getCoinHistory(userId: string, page: number = 1, limit: number = 20) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, Math.min(50, limit));
  const offset = (safePage - 1) * safeLimit;

  const countRes = await query<any>(
    `SELECT COUNT(*) as total FROM popolive.coin_transactions WHERE user_id = $1`,
    [userId]
  );
  const total = parseInt(countRes[0]?.total || '0', 10);

  const rows = await query<any>(
    `SELECT id, transaction_id, wallet_id, user_id, transaction_type, direction,
            coin_amount, previous_balance, new_balance, status, reference_id,
            related_tx_id, idempotency_key, description, metadata, created_at
     FROM popolive.coin_transactions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, safeLimit, offset]
  );

  const transactions = rows.map((r) => ({
    id: r.id,
    transactionId: r.transaction_id,
    walletId: r.wallet_id,
    userId: r.user_id,
    type: r.transaction_type,
    direction: r.direction,
    amount: Number(r.coin_amount),
    coinAmount: Number(r.coin_amount),
    previousBalance: Number(r.previous_balance),
    newBalance: Number(r.new_balance),
    status: r.status,
    referenceId: r.reference_id,
    relatedTxId: r.related_tx_id,
    idempotencyKey: r.idempotency_key,
    description: r.description,
    metadata: r.metadata || {},
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : '',
  }));

  return {
    transactions,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit) || 1,
  };
}

/**
 * Fetches paginated points transaction history for a host user
 * LOCKED RULE 7: Points and coins are separate ledgers — never mix.
 */
export async function getPointsHistory(hostUserId: string, page: number = 1, limit: number = 20) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, Math.min(50, limit));
  const offset = (safePage - 1) * safeLimit;

  const countRes = await query<any>(
    `SELECT COUNT(*) as total FROM popolive.points_transactions WHERE host_user_id = $1`,
    [hostUserId]
  );
  const total = parseInt(countRes[0]?.total || '0', 10);

  const rows = await query<any>(
    `SELECT id, transaction_id, wallet_id, host_user_id, transaction_type, direction,
            points_amount, source_gift_coins, share_percentage_applied, gift_source,
            sender_id, sender_name, previous_balance, new_balance, status, reference_id,
            related_tx_id, idempotency_key, description, metadata, created_at
     FROM popolive.points_transactions
     WHERE host_user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [hostUserId, safeLimit, offset]
  );

  const transactions = rows.map((r) => ({
    id: r.id,
    transactionId: r.transaction_id,
    walletId: r.wallet_id,
    hostUserId: r.host_user_id,
    type: r.transaction_type,
    direction: r.direction,
    amount: Number(r.points_amount),
    pointsAmount: Number(r.points_amount),
    sourceGiftCoins: Number(r.source_gift_coins || 0),
    sharePercentageApplied: Number(r.share_percentage_applied || 70.0),
    giftSource: r.gift_source || 'Virtual Gift',
    senderId: r.sender_id,
    senderName: r.sender_name,
    previousBalance: Number(r.previous_balance),
    newBalance: Number(r.new_balance),
    status: r.status,
    referenceId: r.reference_id,
    relatedTxId: r.related_tx_id,
    idempotencyKey: r.idempotency_key,
    description: r.description,
    metadata: r.metadata || {},
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : '',
  }));

  return {
    transactions,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit) || 1,
  };
}

/**
 * Single Transaction Detail for Audit
 * PART 4: GET /economy/transactions/:id
 * Security: Checks ownership or staff role before exposing details
 */
export async function getTransactionDetail(transactionId: string, requestingUser: AuthUser) {
  // 1. Search coin_transactions
  const coinRows = await query<any>(
    `SELECT ct.*, uw.wallet_id as wallet_uuid
     FROM popolive.coin_transactions ct
     LEFT JOIN popolive.user_wallets uw ON ct.wallet_id = uw.wallet_id
     WHERE ct.transaction_id = $1 OR ct.id::text = $1
     LIMIT 1`,
    [transactionId]
  );

  if (coinRows.length > 0) {
    const row = coinRows[0];
    if (row.user_id !== requestingUser.id && !isStaffMember(requestingUser)) {
      const err: any = new Error('FORBIDDEN: You do not have permission to view this transaction.');
      err.code = 'FORBIDDEN';
      err.status = 403;
      throw err;
    }
    return {
      id: row.id,
      transactionId: row.transaction_id,
      ledger: 'coins',
      currency: 'coins',
      userId: row.user_id,
      walletId: row.wallet_id,
      type: row.transaction_type,
      direction: row.direction,
      amount: Number(row.coin_amount),
      previousBalance: Number(row.previous_balance),
      newBalance: Number(row.new_balance),
      status: row.status,
      referenceId: row.reference_id,
      relatedTxId: row.related_tx_id,
      idempotencyKey: row.idempotency_key,
      description: row.description,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
    };
  }

  // 2. Search points_transactions
  const pointsRows = await query<any>(
    `SELECT pt.*
     FROM popolive.points_transactions pt
     WHERE pt.transaction_id = $1 OR pt.id::text = $1
     LIMIT 1`,
    [transactionId]
  );

  if (pointsRows.length > 0) {
    const row = pointsRows[0];
    if (row.host_user_id !== requestingUser.id && row.sender_id !== requestingUser.id && !isStaffMember(requestingUser)) {
      const err: any = new Error('FORBIDDEN: You do not have permission to view this transaction.');
      err.code = 'FORBIDDEN';
      err.status = 403;
      throw err;
    }
    return {
      id: row.id,
      transactionId: row.transaction_id,
      ledger: 'points',
      currency: 'diamond_points',
      hostUserId: row.host_user_id,
      senderId: row.sender_id,
      senderName: row.sender_name,
      walletId: row.wallet_id,
      type: row.transaction_type,
      direction: row.direction,
      amount: Number(row.points_amount),
      sourceGiftCoins: Number(row.source_gift_coins),
      sharePercentageApplied: Number(row.share_percentage_applied),
      giftSource: row.gift_source,
      previousBalance: Number(row.previous_balance),
      newBalance: Number(row.new_balance),
      status: row.status,
      referenceId: row.reference_id,
      relatedTxId: row.related_tx_id,
      idempotencyKey: row.idempotency_key,
      description: row.description,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
    };
  }

  // 3. Search gift_transactions
  const giftRows = await query<any>(
    `SELECT gt.*
     FROM popolive.gift_transactions gt
     WHERE gt.gift_transaction_id = $1 OR gt.id::text = $1
     LIMIT 1`,
    [transactionId]
  );

  if (giftRows.length > 0) {
    const row = giftRows[0];
    if (row.sender_user_id !== requestingUser.id && row.recipient_host_id !== requestingUser.id && !isStaffMember(requestingUser)) {
      const err: any = new Error('FORBIDDEN: You do not have permission to view this transaction.');
      err.code = 'FORBIDDEN';
      err.status = 403;
      throw err;
    }
    return {
      id: row.id,
      transactionId: row.gift_transaction_id,
      ledger: 'gift',
      senderUserId: row.sender_user_id,
      senderNickname: row.sender_nickname,
      recipientHostId: row.recipient_host_id,
      recipientNickname: row.recipient_nickname,
      liveRoomId: row.live_room_id,
      giftId: row.gift_id,
      giftName: row.gift_name_snapshot,
      quantity: Number(row.quantity),
      totalCoins: Number(row.total_coin_amount),
      hostPointsCredited: Number(row.host_points_credited),
      platformShare: Number(row.platform_share),
      sharePercentage: Number(row.share_percentage),
      status: row.status,
      coinTxId: row.coin_tx_id,
      idempotencyKey: row.idempotency_key,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
    };
  }

  return null;
}

/**
 * RECONCILED ATOMIC GIFT SENDING ENGINE
 * Single authoritative implementation that satisfies:
 * - Locked Rule 1: Age 18+ enforcement
 * - Locked Rule 2: Non-negative balance constraint (coins >= totalCoins)
 * - Locked Rule 3: Atomic transaction with row-level locking (SELECT FOR UPDATE)
 * - Locked Rule 4: Transaction rows created in both coin_transactions and points_transactions
 * - Locked Rule 5: Duplicate prevention via idempotency key
 * - Locked Rule 6: 70% host revenue share recorded in gift_transactions & points_transactions
 * - Locked Rule 7: Strict separation of coins and points ledgers
 */
export async function executeAtomicGiftSend({
  senderUser,
  roomId,
  giftId,
  quantity = 1,
  idempotencyKey,
}: {
  senderUser: AuthUser;
  roomId: string;
  giftId: string;
  quantity?: number;
  idempotencyKey?: string;
}) {
  // 1. Locked Rule 1: Age 18+ verification
  assertAdultEconomy(senderUser, 'send gifts');

  const giftCount = Math.max(1, Math.floor(Number(quantity) || 1));
  const safeIdempotencyKey = (
    idempotencyKey || `gift_${senderUser.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  ).trim();

  // 2. Resolve room and broadcaster
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
    const error: any = new Error('ROOM_NOT_FOUND: Live room not found.');
    error.code = 'ROOM_NOT_FOUND';
    error.status = 404;
    throw error;
  }

  const room = roomRows[0];
  const hostId = room.host_id;

  // Self-gifting disallowance
  if (hostId === senderUser.id) {
    const error: any = new Error('SELF_GIFT_DISALLOWED: Broadcasters cannot send gifts to their own broadcast room.');
    error.code = 'SELF_GIFT_DISALLOWED';
    error.status = 400;
    throw error;
  }

  // 3. Locked Rule 5: Idempotency Key check
  const existingTx = await query<any>(
    `SELECT id, gift_transaction_id, total_coin_amount, host_points_credited, status
     FROM popolive.gift_transactions
     WHERE idempotency_key = $1
     LIMIT 1`,
    [safeIdempotencyKey]
  );

  if (existingTx.length > 0) {
    const tx = existingTx[0];
    const senderWallet = await getOrCreateUserWallet(senderUser.id);
    return {
      isIdempotentReplay: true,
      message: 'Gift already processed with this transaction token.',
      transactionId: tx.gift_transaction_id,
      coinsDeducted: Number(tx.total_coin_amount),
      hostPointsCredited: Number(tx.host_points_credited),
      remainingCoins: senderWallet.coins,
      gift: {
        id: giftId,
        quantity: giftCount,
      },
      hostSharePercent: 70.0,
    };
  }

  // 4. Resolve gift price from gift_catalog
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

  // 5. Locked Rule 6: Host 70% share from finance_rules
  const ruleRows = await query<any>(
    `SELECT rule_value FROM popolive.finance_rules WHERE rule_key = 'host_gift_share_percent' LIMIT 1`
  );
  const hostSharePercent = ruleRows.length > 0 ? Number(ruleRows[0].rule_value) : 70.0;
  const hostPoints = Math.round((totalCoins * hostSharePercent) / 100);
  const platformShare = totalCoins - hostPoints;

  // 6. Execute atomic transfer with row lock
  const transferResult = await withTransaction(async (client) => {
    // Row-level lock on sender wallet
    let senderWalletRes = await client.query(
      `SELECT wallet_id, user_id, coins FROM popolive.user_wallets WHERE user_id = $1 FOR UPDATE`,
      [senderUser.id]
    );

    let senderCoins = 0;
    let senderWalletId = null;

    if (senderWalletRes.rows.length === 0) {
      const initWallet = await client.query(
        `INSERT INTO popolive.user_wallets (wallet_id, user_id, coins, diamond_points, total_spent_coins, total_received_points)
         VALUES (gen_random_uuid(), $1, 0, 0, 0, 0)
         RETURNING wallet_id, coins`,
        [senderUser.id]
      );
      senderCoins = 0;
      senderWalletId = initWallet.rows[0].wallet_id;
    } else {
      senderCoins = Number(senderWalletRes.rows[0].coins);
      senderWalletId = senderWalletRes.rows[0].wallet_id;
    }

    // Locked Rule 2: Coin balance must never go negative
    if (senderCoins < totalCoins) {
      const err: any = new Error(
        `INSUFFICIENT_BALANCE: You need ${totalCoins.toLocaleString()} coins, but your balance is ${senderCoins.toLocaleString()} coins.`
      );
      err.code = 'INSUFFICIENT_BALANCE';
      err.status = 400;
      throw err;
    }

    const newSenderCoins = senderCoins - totalCoins;

    // Ensure and lock host wallet
    await client.query(
      `INSERT INTO popolive.user_wallets (wallet_id, user_id, coins, diamond_points, total_spent_coins, total_received_points)
       VALUES (gen_random_uuid(), $1, 0, 0, 0, 0)
       ON CONFLICT (user_id) DO NOTHING`,
      [hostId]
    );

    const hostWalletRes = await client.query(
      `SELECT wallet_id, diamond_points FROM popolive.user_wallets WHERE user_id = $1 FOR UPDATE`,
      [hostId]
    );
    const hostWalletId = hostWalletRes.rows[0].wallet_id;
    const hostPrevPoints = Number(hostWalletRes.rows[0].diamond_points) || 0;
    const hostNewPoints = hostPrevPoints + hostPoints;

    // Deduct coins from sender wallet
    await client.query(
      `UPDATE popolive.user_wallets
       SET coins = coins - $1,
           total_spent_coins = total_spent_coins + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2`,
      [totalCoins, senderUser.id]
    );

    // Credit points to host wallet
    await client.query(
      `UPDATE popolive.user_wallets
       SET diamond_points = diamond_points + $1,
           total_received_points = total_received_points + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2`,
      [hostPoints, hostId]
    );

    // Record coin transaction row (debit)
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
        senderUser.id,
        totalCoins,
        senderCoins,
        newSenderCoins,
        room.id,
        `coin_${safeIdempotencyKey}`,
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
        senderUser.id,
        senderUser.nickname,
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
        safeIdempotencyKey,
      ]
    );

    // Record points transaction row (credit) for host
    const ptsTxId = `ptx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    await client.query(
      `INSERT INTO popolive.points_transactions (
        id, transaction_id, wallet_id, host_user_id, transaction_type, direction,
        points_amount, source_gift_coins, share_percentage_applied, gift_source,
        sender_id, sender_name, previous_balance, new_balance, status,
        reference_id, related_tx_id, idempotency_key, description, metadata,
        created_by, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, 'gift_earned', 'credit',
        $4, $5, $6, 'Live Room',
        $7, $8, $9, $10, 'completed',
        $11, $12, $13, $14, '{}'::jsonb,
        'gift_service', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )`,
      [
        ptsTxId,
        hostWalletId,
        hostId,
        hostPoints,
        totalCoins,
        hostSharePercent,
        senderUser.id,
        senderUser.nickname,
        hostPrevPoints,
        hostNewPoints,
        room.id,
        giftTxId,
        `pts_${safeIdempotencyKey}`,
        `Received ${giftCount}x ${giftName} from ${senderUser.nickname}`,
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

  return {
    isIdempotentReplay: false,
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
  };
}
