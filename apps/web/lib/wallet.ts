import crypto from 'crypto';
import { query, withTransaction } from '@/lib/db';
import { redisDel, redisGet, redisSetWithTtl } from '@/lib/redis';

// =============================================================================
// Popo Live Phase 7 Module 7.1 — Central Coins & Points Management Engine
// Single source of truth for Flutter Android, Flutter iOS, Next.js Web, Admin
// =============================================================================

export const DEFAULT_DEMO_WALLET_USER_ID = 'user_wallet_demo_701';
export const DEFAULT_HOST_SHARE_PERCENT = 70; // Approved Popo Live build plan rule

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'reversed';
export type BalanceType = 'coins' | 'points';

export interface WalletBalance {
  walletId: string;
  userId: string;
  coins: number;
  points: number;
  totalSpentCoins: number;
  totalReceivedPoints: number;
  isFrozen: boolean;
  hostSharePercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface CoinTransactionRecord {
  id: string;
  transactionId: string;
  walletId: string;
  userId: string;
  transactionType:
    | 'topup'
    | 'gift_sent'
    | 'admin_credit'
    | 'admin_debit'
    | 'reversal'
    | 'initial_credit'
    | 'feature_spend';
  direction: 'credit' | 'debit';
  coinAmount: number;
  previousBalance: number;
  newBalance: number;
  status: TransactionStatus;
  referenceId: string | null;
  relatedTxId: string | null;
  idempotencyKey: string | null;
  description: string | null;
  metadata: Record<string, any>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PointsTransactionRecord {
  id: string;
  transactionId: string;
  walletId: string;
  hostUserId: string;
  transactionType:
    | 'gift_earned'
    | 'pk_gift_earned'
    | 'admin_credit'
    | 'admin_debit'
    | 'reversal';
  direction: 'credit' | 'debit';
  pointsAmount: number;
  sourceGiftCoins: number;
  sharePercentageApplied: number;
  giftSource: string;
  senderId: string | null;
  senderName: string | null;
  previousBalance: number;
  newBalance: number;
  status: TransactionStatus;
  referenceId: string | null;
  relatedTxId: string | null;
  idempotencyKey: string | null;
  description: string | null;
  metadata: Record<string, any>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletAuditLogRecord {
  id: string;
  auditId: string;
  targetUserId: string;
  walletId: string | null;
  actionType: string;
  actorId: string;
  actorRole: string;
  reason: string;
  balanceType: 'coins' | 'points' | 'both' | 'none';
  amount: number;
  previousBalance: number | null;
  newBalance: number | null;
  referenceTxId: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface FinanceRulesConfig {
  hostGiftSharePercent: number;
  newUserInitialCoins: number;
  newUserInitialPoints: number;
  minTransactionAmount: number;
  maxSingleTransactionAmount: number;
}

export function generateTxId(prefix: string): string {
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}_${Date.now()}_${rand}`;
}

export function mapWalletRow(row: any, sharePercent: number): WalletBalance {
  return {
    walletId: row.wallet_id,
    userId: row.user_id,
    coins: parseInt(String(row.coins ?? '0'), 10),
    points: parseInt(String(row.diamond_points ?? '0'), 10),
    totalSpentCoins: parseInt(String(row.total_spent_coins ?? '0'), 10),
    totalReceivedPoints: parseInt(String(row.total_received_points ?? '0'), 10),
    isFrozen: Boolean(row.is_frozen),
    hostSharePercentage: sharePercent,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

function mapCoinTxRow(r: any): CoinTransactionRecord {
  return {
    id: r.id,
    transactionId: r.transaction_id,
    walletId: r.wallet_id,
    userId: r.user_id,
    transactionType: r.transaction_type,
    direction: r.direction,
    coinAmount: parseInt(String(r.coin_amount ?? '0'), 10),
    previousBalance: parseInt(String(r.previous_balance ?? '0'), 10),
    newBalance: parseInt(String(r.new_balance ?? '0'), 10),
    status: r.status,
    referenceId: r.reference_id || null,
    relatedTxId: r.related_tx_id || null,
    idempotencyKey: r.idempotency_key || null,
    description: r.description || null,
    metadata: typeof r.metadata === 'object' && r.metadata !== null ? r.metadata : {},
    createdBy: r.created_by || 'system',
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : '',
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : '',
  };
}

function mapPointsTxRow(r: any, maskSender: boolean = false): PointsTransactionRecord {
  return {
    id: r.id,
    transactionId: r.transaction_id,
    walletId: r.wallet_id,
    hostUserId: r.host_user_id,
    transactionType: r.transaction_type,
    direction: r.direction,
    pointsAmount: parseInt(String(r.points_amount ?? '0'), 10),
    sourceGiftCoins: parseInt(String(r.source_gift_coins ?? '0'), 10),
    sharePercentageApplied: parseFloat(String(r.share_percentage_applied ?? '70')),
    giftSource: r.gift_source || 'Virtual Gift',
    senderId: maskSender && r.sender_id ? '***' : r.sender_id || null,
    senderName: maskSender ? 'Verified Supporter' : r.sender_name || null,
    previousBalance: parseInt(String(r.previous_balance ?? '0'), 10),
    newBalance: parseInt(String(r.new_balance ?? '0'), 10),
    status: r.status,
    referenceId: r.reference_id || null,
    relatedTxId: r.related_tx_id || null,
    idempotencyKey: r.idempotency_key || null,
    description: r.description || null,
    metadata: typeof r.metadata === 'object' && r.metadata !== null ? r.metadata : {},
    createdBy: r.created_by || 'finance_engine',
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : '',
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : '',
  };
}

// =============================================================================
// 1. Configurable Backend Finance Rules & Approved Host Share Calculation
// =============================================================================

export async function getFinanceRules(dbClient?: any): Promise<FinanceRulesConfig> {
  const exec = dbClient
    ? (sql: string, params?: any[]) => dbClient.query(sql, params).then((r: any) => r.rows)
    : query;

  try {
    const rows = await exec(`SELECT rule_key, rule_value FROM popolive.finance_rules`);
    const map: Record<string, number> = {};
    for (const r of rows) {
      map[r.rule_key] = parseFloat(String(r.rule_value));
    }
    return {
      hostGiftSharePercent: map.host_gift_share_percent ?? DEFAULT_HOST_SHARE_PERCENT,
      newUserInitialCoins: map.new_user_initial_coins ?? 0,
      newUserInitialPoints: map.new_user_initial_points ?? 0,
      minTransactionAmount: map.min_transaction_amount ?? 1,
      maxSingleTransactionAmount: map.max_single_transaction_amount ?? 10000000,
    };
  } catch {
    return {
      hostGiftSharePercent: DEFAULT_HOST_SHARE_PERCENT,
      newUserInitialCoins: 0,
      newUserInitialPoints: 0,
      minTransactionAmount: 1,
      maxSingleTransactionAmount: 10000000,
    };
  }
}

export async function calculateHostShare(
  giftCoins: number,
  dbClient?: any
): Promise<{ pointsEarned: number; sharePercent: number }> {
  if (!Number.isFinite(giftCoins) || giftCoins <= 0) {
    return { pointsEarned: 0, sharePercent: DEFAULT_HOST_SHARE_PERCENT };
  }
  const rules = await getFinanceRules(dbClient);
  const sharePercent = rules.hostGiftSharePercent;
  const pointsEarned = Math.floor((giftCoins * sharePercent) / 100);
  return { pointsEarned, sharePercent };
}

// =============================================================================
// 2. Real-Time Wallet Event Emitter (Persisted Outbox + Redis Cache Invalidate)
// =============================================================================

export async function emitWalletRealtimeEvent(
  dbClient: any,
  userId: string,
  eventType:
    | 'wallet:coin_balance_updated'
    | 'wallet:points_balance_updated'
    | 'wallet:transaction_completed'
    | 'wallet:transaction_failed'
    | 'wallet:transaction_reversed',
  payload: Record<string, any>
): Promise<void> {
  const executor = dbClient
    ? (sql: string, params?: any[]) => dbClient.query(sql, params)
    : query;

  await executor(
    `INSERT INTO popolive.wallet_realtime_events (user_id, event_type, payload)
     VALUES ($1, $2, $3::jsonb)`,
    [userId, eventType, JSON.stringify({ ...payload, emittedAt: new Date().toISOString() })]
  );

  // Invalidate fast wallet cache so subsequent reads reflect fresh authoritative state
  await redisDel(`wallet:balance:${userId}`).catch(() => {});
}

export async function ensureWalletLocked(dbClient: any, userId: string, rules: FinanceRulesConfig) {
  let rows = (
    await dbClient.query(
      `SELECT wallet_id, user_id, coins, diamond_points, total_spent_coins, total_received_points, is_frozen, created_at, updated_at
       FROM popolive.user_wallets
       WHERE user_id = $1
       FOR UPDATE`,
      [userId]
    )
  ).rows;

  if (rows.length === 0) {
    const initialCoins =
      userId === DEFAULT_DEMO_WALLET_USER_ID
        ? 12500
        : userId === 'user_viewer_9001'
        ? 3600
        : rules.newUserInitialCoins;
    const initialPoints =
      userId === DEFAULT_DEMO_WALLET_USER_ID ? 8420 : rules.newUserInitialPoints;

    await dbClient.query(
      `INSERT INTO popolive.user_wallets (user_id, coins, diamond_points)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId, initialCoins, initialPoints]
    );

    rows = (
      await dbClient.query(
        `SELECT wallet_id, user_id, coins, diamond_points, total_spent_coins, total_received_points, is_frozen, created_at, updated_at
         FROM popolive.user_wallets
         WHERE user_id = $1
         FOR UPDATE`,
        [userId]
      )
    ).rows;

    if (rows.length > 0) {
      if (initialCoins > 0) {
        await dbClient.query(
          `INSERT INTO popolive.coin_transactions (
             transaction_id, wallet_id, user_id, transaction_type, direction, coin_amount,
             previous_balance, new_balance, status, reference_id, description, created_by
           ) VALUES ($1, $2, $3, 'initial_credit', 'credit', $4, 0, $4, 'completed', 'WALLET_INIT', 'Initial approved wallet coin allocation', 'system')
           ON CONFLICT (transaction_id) DO NOTHING`,
          [generateTxId('TXN_INIT'), rows[0].wallet_id, userId, initialCoins]
        );
      }
      await dbClient.query(
        `INSERT INTO popolive.user_recognition_coin_pools (user_id, paid_coins, promo_coins, updated_at)
         VALUES ($1, 0, $2, NOW())
         ON CONFLICT (user_id) DO NOTHING`,
        [userId, initialCoins]
      );
    }
  }

  return rows[0];
}

// =============================================================================
// 3. Get Coin & Points Balances (Cached + Authoritative DB Synchronization)
// =============================================================================

export async function getWalletSummary(
  userId: string,
  bypassCache: boolean = false
): Promise<WalletBalance> {
  if (!bypassCache) {
    const cached = await redisGet(`wallet:balance:${userId}`);
    if (cached) {
      try {
        return JSON.parse(cached) as WalletBalance;
      } catch {}
    }
  }

  const rules = await getFinanceRules();
  const wallet = await withTransaction(async (client) => {
    const row = await ensureWalletLocked(client, userId, rules);
    return mapWalletRow(row, rules.hostGiftSharePercent);
  });

  await redisSetWithTtl(`wallet:balance:${userId}`, JSON.stringify(wallet), 15).catch(() => {});
  return wallet;
}

export async function getCoinBalance(userId: string): Promise<{ userId: string; walletId: string; coins: number; updatedAt: string }> {
  const w = await getWalletSummary(userId);
  return { userId: w.userId, walletId: w.walletId, coins: w.coins, updatedAt: w.updatedAt };
}

export async function getPointsBalance(userId: string): Promise<{
  userId: string;
  walletId: string;
  points: number;
  totalReceivedPoints: number;
  hostSharePercentage: number;
  updatedAt: string;
}> {
  const w = await getWalletSummary(userId);
  return {
    userId: w.userId,
    walletId: w.walletId,
    points: w.points,
    totalReceivedPoints: w.totalReceivedPoints,
    hostSharePercentage: w.hostSharePercentage,
    updatedAt: w.updatedAt,
  };
}

// =============================================================================
// 4. Credit Coins & Deduct Coins (Atomic Transactions + Idempotency)
// =============================================================================

export async function creditCoinsInTx(
  client: any,
  params: {
    userId: string;
    amount: number;
    transactionType: 'topup' | 'admin_credit' | 'initial_credit' | 'reversal';
    referenceId?: string;
    relatedTxId?: string;
    idempotencyKey?: string;
    description?: string;
    createdBy?: string;
    metadata?: Record<string, any>;
  }
): Promise<{
  success: boolean;
  isDuplicate?: boolean;
  transaction: CoinTransactionRecord;
  wallet: WalletBalance;
}> {
  const {
    userId,
    amount,
    transactionType,
    referenceId,
    relatedTxId,
    idempotencyKey,
    description,
    createdBy = 'system',
    metadata = {},
  } = params;

  if (!userId || !Number.isInteger(amount) || amount <= 0) {
    throw Object.assign(new Error('Invalid coin credit amount. Must be a positive integer.'), {
      code: 'INVALID_AMOUNT',
      status: 400,
    });
  }

  const rules = await getFinanceRules(client);
  if (amount > rules.maxSingleTransactionAmount) {
    throw Object.assign(new Error('Coin credit exceeds single-transaction safety limit.'), {
      code: 'AMOUNT_LIMIT_EXCEEDED',
      status: 400,
    });
  }

  if (idempotencyKey) {
    const existing = (
      await client.query(`SELECT * FROM popolive.coin_transactions WHERE idempotency_key = $1`, [
        idempotencyKey,
      ])
    ).rows;
    if (existing.length > 0) {
      const currentWallet = await ensureWalletLocked(client, userId, rules);
      return {
        success: true,
        isDuplicate: true,
        transaction: mapCoinTxRow(existing[0]),
        wallet: mapWalletRow(currentWallet, rules.hostGiftSharePercent),
      };
    }
  }

  const walletRow = await ensureWalletLocked(client, userId, rules);
  if (walletRow.is_frozen) {
    throw Object.assign(new Error('Wallet is currently frozen for security review.'), {
      code: 'WALLET_FROZEN',
      status: 403,
    });
  }

  const prevCoins = parseInt(String(walletRow.coins), 10);
  const newCoins = prevCoins + amount;

  const updatedRows = (
    await client.query(
      `UPDATE popolive.user_wallets
       SET coins = $1, updated_at = NOW()
       WHERE user_id = $2
       RETURNING *`,
      [newCoins, userId]
    )
  ).rows;

  const txId = generateTxId('TXN_COIN');
  const txRows = (
    await client.query(
      `INSERT INTO popolive.coin_transactions (
         transaction_id, wallet_id, user_id, transaction_type, direction, coin_amount,
         previous_balance, new_balance, status, reference_id, related_tx_id, idempotency_key,
         description, metadata, created_by
       ) VALUES ($1, $2, $3, $4, 'credit', $5, $6, $7, 'completed', $8, $9, $10, $11, $12::jsonb, $13)
       RETURNING *`,
      [
        txId,
        walletRow.wallet_id,
        userId,
        transactionType,
        amount,
        prevCoins,
        newCoins,
        referenceId || null,
        relatedTxId || null,
        idempotencyKey || null,
        description || `Credited ${amount} coins (${transactionType})`,
        JSON.stringify(metadata),
        createdBy,
      ]
    )
  ).rows;

  const mappedTx = mapCoinTxRow(txRows[0]);
  const mappedWallet = mapWalletRow(updatedRows[0], rules.hostGiftSharePercent);

  // Module 7.8: track paid vs promotional coins accurately for Wealth eligibility
  const { recordCoinPoolCreditInTx } = await import('@/lib/recognition');
  if (transactionType === 'topup') {
    const baseCoins = Number.isFinite(Number(metadata?.baseCoins))
      ? Math.max(0, Math.floor(Number(metadata.baseCoins)))
      : amount;
    const bonusCoins = Number.isFinite(Number(metadata?.bonusCoins))
      ? Math.max(0, Math.floor(Number(metadata.bonusCoins)))
      : Math.max(0, amount - baseCoins);
    await recordCoinPoolCreditInTx(client, {
      userId,
      paidCoins: baseCoins,
      promoCoins: bonusCoins,
      walletCoinsBefore: prevCoins,
      excludeTxId: txId,
    });
  } else if (transactionType === 'initial_credit' || Boolean(metadata?.isPromotional)) {
    await recordCoinPoolCreditInTx(client, {
      userId,
      paidCoins: 0,
      promoCoins: amount,
      walletCoinsBefore: prevCoins,
      excludeTxId: txId,
    });
  } else if (transactionType === 'admin_credit') {
    await recordCoinPoolCreditInTx(client, {
      userId,
      paidCoins: amount,
      promoCoins: 0,
      walletCoinsBefore: prevCoins,
      excludeTxId: txId,
    });
  }

  await emitWalletRealtimeEvent(client, userId, 'wallet:coin_balance_updated', {
    userId,
    walletId: mappedWallet.walletId,
    coins: newCoins,
    previousBalance: prevCoins,
    delta: amount,
    transactionId: txId,
  });

  await emitWalletRealtimeEvent(client, userId, 'wallet:transaction_completed', {
    ledger: 'coins',
    transaction: mappedTx,
  });

  return {
    success: true,
    transaction: mappedTx,
    wallet: mappedWallet,
  };
}

export async function creditCoins(params: {
  userId: string;
  amount: number;
  transactionType: 'topup' | 'admin_credit' | 'initial_credit' | 'reversal';
  referenceId?: string;
  relatedTxId?: string;
  idempotencyKey?: string;
  description?: string;
  createdBy?: string;
  metadata?: Record<string, any>;
}): Promise<{
  success: boolean;
  isDuplicate?: boolean;
  transaction: CoinTransactionRecord;
  wallet: WalletBalance;
}> {
  return withTransaction((client) => creditCoinsInTx(client, params));
}

export async function deductCoinsInTx(
  client: any,
  params: {
    userId: string;
    amount: number;
    transactionType: 'gift_sent' | 'admin_debit' | 'feature_spend' | 'reversal';
    referenceId?: string;
    relatedTxId?: string;
    idempotencyKey?: string;
    description?: string;
    createdBy?: string;
    metadata?: Record<string, any>;
  }
): Promise<{
  success: boolean;
  isDuplicate?: boolean;
  code?: string;
  error?: string;
  transaction: CoinTransactionRecord;
  wallet: WalletBalance;
}> {
  const {
    userId,
    amount,
    transactionType,
    referenceId,
    relatedTxId,
    idempotencyKey,
    description,
    createdBy = 'system',
    metadata = {},
  } = params;

  if (!userId || !Number.isInteger(amount) || amount <= 0) {
    throw Object.assign(new Error('Invalid coin deduction amount. Must be a positive integer.'), {
      code: 'INVALID_AMOUNT',
      status: 400,
    });
  }

  const rules = await getFinanceRules(client);

    if (idempotencyKey) {
      const existing = (
        await client.query(`SELECT * FROM popolive.coin_transactions WHERE idempotency_key = $1`, [
          idempotencyKey,
        ])
      ).rows;
      if (existing.length > 0) {
        const currentWallet = await ensureWalletLocked(client, userId, rules);
        const mappedExisting = mapCoinTxRow(existing[0]);
        return {
          success: mappedExisting.status === 'completed',
          isDuplicate: true,
          transaction: mappedExisting,
          wallet: mapWalletRow(currentWallet, rules.hostGiftSharePercent),
        };
      }
    }

    const walletRow = await ensureWalletLocked(client, userId, rules);
    if (walletRow.is_frozen) {
      throw Object.assign(new Error('Wallet is frozen for security review.'), {
        code: 'WALLET_FROZEN',
        status: 403,
      });
    }

    const prevCoins = parseInt(String(walletRow.coins), 10);

    // Negative balance protection: if coins insufficient, log failed record & DO NOT deduct
    if (prevCoins < amount) {
      const failTxId = generateTxId('TXN_COIN_FAIL');
      const failRows = (
        await client.query(
          `INSERT INTO popolive.coin_transactions (
             transaction_id, wallet_id, user_id, transaction_type, direction, coin_amount,
             previous_balance, new_balance, status, reference_id, related_tx_id, idempotency_key,
             description, metadata, created_by
           ) VALUES ($1, $2, $3, $4, 'debit', $5, $6, $6, 'failed', $7, $8, $9, $10, $11::jsonb, $12)
           RETURNING *`,
          [
            failTxId,
            walletRow.wallet_id,
            userId,
            transactionType,
            amount,
            prevCoins,
            referenceId || null,
            relatedTxId || null,
            idempotencyKey || null,
            description || `Failed: Insufficient coins (need ${amount}, available ${prevCoins})`,
            JSON.stringify({ ...metadata, failureReason: 'INSUFFICIENT_COINS' }),
            createdBy,
          ]
        )
      ).rows;

      await client.query(
        `INSERT INTO popolive.wallet_audit_logs (
           audit_id, target_user_id, wallet_id, action_type, actor_id, actor_role, reason,
           balance_type, amount, previous_balance, new_balance, reference_tx_id
         ) VALUES ($1, $2, $3, 'negative_balance_blocked', $4, 'system', $5, 'coins', $6, $7, $7, $8)`,
        [
          generateTxId('AUDIT'),
          userId,
          walletRow.wallet_id,
          createdBy,
          `Blocked negative coin balance attempt: requested ${amount}, available ${prevCoins}`,
          amount,
          prevCoins,
          failTxId,
        ]
      );

      await emitWalletRealtimeEvent(client, userId, 'wallet:transaction_failed', {
        ledger: 'coins',
        code: 'INSUFFICIENT_COINS',
        transaction: mapCoinTxRow(failRows[0]),
      });

      return {
        success: false,
        code: 'INSUFFICIENT_COINS',
        error: `Insufficient coin balance. Required: ${amount}, available: ${prevCoins}.`,
        transaction: mapCoinTxRow(failRows[0]),
        wallet: mapWalletRow(walletRow, rules.hostGiftSharePercent),
      };
    }

    const newCoins = prevCoins - amount;
    const spentIncrement = transactionType === 'gift_sent' || transactionType === 'feature_spend' ? amount : 0;

    const updatedRows = (
      await client.query(
        `UPDATE popolive.user_wallets
         SET coins = $1,
             total_spent_coins = total_spent_coins + $2,
             updated_at = NOW()
         WHERE user_id = $3 AND coins >= $4
         RETURNING *`,
        [newCoins, spentIncrement, userId, amount]
      )
    ).rows;

    const txId = generateTxId('TXN_COIN');
    const txRows = (
      await client.query(
        `INSERT INTO popolive.coin_transactions (
           transaction_id, wallet_id, user_id, transaction_type, direction, coin_amount,
           previous_balance, new_balance, status, reference_id, related_tx_id, idempotency_key,
           description, metadata, created_by
         ) VALUES ($1, $2, $3, $4, 'debit', $5, $6, $7, 'completed', $8, $9, $10, $11, $12::jsonb, $13)
         RETURNING *`,
        [
          txId,
          walletRow.wallet_id,
          userId,
          transactionType,
          amount,
          prevCoins,
          newCoins,
          referenceId || null,
          relatedTxId || null,
          idempotencyKey || null,
          description || `Deducted ${amount} coins (${transactionType})`,
          JSON.stringify(metadata),
          createdBy,
        ]
      )
    ).rows;

    const mappedTx = mapCoinTxRow(txRows[0]);
    const mappedWallet = mapWalletRow(updatedRows[0], rules.hostGiftSharePercent);

    // Module 7.8: Wealth tracks eligible non-VIP feature spends (excludes promotional coins unless approved)
    if (
      transactionType === 'feature_spend' &&
      !metadata?.excludeFromWealth &&
      !metadata?.vipPurchase &&
      !/^VIP/i.test(String(referenceId || '')) &&
      !/\bVIP\b/i.test(String(description || ''))
    ) {
      const { recordCoinSpendWealthInTx } = await import('@/lib/recognition');
      await recordCoinSpendWealthInTx(client, {
        userId,
        coinsSpent: amount,
        sourceType: 'feature_spend',
        sourceTxId: txId,
        walletCoinsBeforeSpend: prevCoins,
        excludeFromWealth: false,
      });
    }

    await emitWalletRealtimeEvent(client, userId, 'wallet:coin_balance_updated', {
      userId,
      walletId: mappedWallet.walletId,
      coins: newCoins,
      previousBalance: prevCoins,
      delta: -amount,
      transactionId: txId,
    });

    await emitWalletRealtimeEvent(client, userId, 'wallet:transaction_completed', {
      ledger: 'coins',
      transaction: mappedTx,
    });

    return {
      success: true,
      transaction: mappedTx,
      wallet: mappedWallet,
    };
}

export async function deductCoins(params: {
  userId: string;
  amount: number;
  transactionType: 'gift_sent' | 'admin_debit' | 'feature_spend' | 'reversal';
  referenceId?: string;
  relatedTxId?: string;
  idempotencyKey?: string;
  description?: string;
  createdBy?: string;
  metadata?: Record<string, any>;
}): Promise<{
  success: boolean;
  isDuplicate?: boolean;
  code?: string;
  error?: string;
  transaction: CoinTransactionRecord;
  wallet: WalletBalance;
}> {
  return withTransaction((client) => deductCoinsInTx(client, params));
}

// =============================================================================
// 5. Credit Host Points & Combined Atomic Gift Transfer (Deadlock-Safe Locking)
// =============================================================================

export async function creditHostPoints(params: {
  hostUserId: string;
  sourceGiftCoins: number;
  giftSource: string;
  senderId?: string;
  senderName?: string;
  transactionType?: 'gift_earned' | 'pk_gift_earned' | 'admin_credit';
  explicitPoints?: number;
  referenceId?: string;
  idempotencyKey?: string;
  description?: string;
  createdBy?: string;
}): Promise<{
  success: boolean;
  isDuplicate?: boolean;
  transaction: PointsTransactionRecord;
  wallet: WalletBalance;
}> {
  const {
    hostUserId,
    sourceGiftCoins,
    giftSource,
    senderId = null,
    senderName = null,
    transactionType = 'gift_earned',
    explicitPoints,
    referenceId,
    idempotencyKey,
    description,
    createdBy = 'finance_engine',
  } = params;

  return withTransaction(async (client) => {
    const rules = await getFinanceRules(client);
    const { pointsEarned, sharePercent } =
      explicitPoints !== undefined
        ? { pointsEarned: explicitPoints, sharePercent: 100 }
        : await calculateHostShare(sourceGiftCoins, client);

    if (idempotencyKey) {
      const existing = (
        await client.query(`SELECT * FROM popolive.points_transactions WHERE idempotency_key = $1`, [
          idempotencyKey,
        ])
      ).rows;
      if (existing.length > 0) {
        const w = await ensureWalletLocked(client, hostUserId, rules);
        return {
          success: true,
          isDuplicate: true,
          transaction: mapPointsTxRow(existing[0]),
          wallet: mapWalletRow(w, rules.hostGiftSharePercent),
        };
      }
    }

    const walletRow = await ensureWalletLocked(client, hostUserId, rules);
    const prevPoints = parseInt(String(walletRow.diamond_points), 10);
    const newPoints = prevPoints + pointsEarned;

    const updatedRows = (
      await client.query(
        `UPDATE popolive.user_wallets
         SET diamond_points = $1,
             total_received_points = total_received_points + $2,
             updated_at = NOW()
         WHERE user_id = $3
         RETURNING *`,
        [newPoints, pointsEarned, hostUserId]
      )
    ).rows;

    const txId = generateTxId('TXN_PTS');
    const txRows = (
      await client.query(
        `INSERT INTO popolive.points_transactions (
           transaction_id, wallet_id, host_user_id, transaction_type, direction, points_amount,
           source_gift_coins, share_percentage_applied, gift_source, sender_id, sender_name,
           previous_balance, new_balance, status, reference_id, idempotency_key, description, created_by
         ) VALUES ($1, $2, $3, $4, 'credit', $5, $6, $7, $8, $9, $10, $11, $12, 'completed', $13, $14, $15, $16)
         RETURNING *`,
        [
          txId,
          walletRow.wallet_id,
          hostUserId,
          transactionType,
          pointsEarned,
          sourceGiftCoins,
          sharePercent,
          giftSource,
          senderId,
          senderName,
          prevPoints,
          newPoints,
          referenceId || null,
          idempotencyKey || null,
          description || `${sharePercent}% host share earned from ${sourceGiftCoins} coins (${giftSource})`,
          createdBy,
        ]
      )
    ).rows;

    const mappedTx = mapPointsTxRow(txRows[0]);
    const mappedWallet = mapWalletRow(updatedRows[0], rules.hostGiftSharePercent);

    await emitWalletRealtimeEvent(client, hostUserId, 'wallet:points_balance_updated', {
      userId: hostUserId,
      walletId: mappedWallet.walletId,
      points: newPoints,
      previousBalance: prevPoints,
      delta: pointsEarned,
      transactionId: txId,
    });

    await emitWalletRealtimeEvent(client, hostUserId, 'wallet:transaction_completed', {
      ledger: 'points',
      transaction: mappedTx,
    });

    return {
      success: true,
      transaction: mappedTx,
      wallet: mappedWallet,
    };
  });
}

export async function processAtomicGiftTransfer(params: {
  senderId: string;
  senderName: string;
  hostUserId: string;
  giftCoins: number;
  giftName: string;
  isPkBattle?: boolean;
  referenceId?: string;
  idempotencyKey?: string;
  onSuccessInTransaction?: (ctx: {
    client: any;
    coinTxRow: any;
    ptsTxRow: any;
    senderWallet: WalletBalance;
    hostWallet: WalletBalance;
    hostPointsEarned: number;
    sharePercent: number;
  }) => Promise<void>;
}): Promise<{
  success: boolean;
  isDuplicate?: boolean;
  code?: string;
  error?: string;
  coinTransaction?: CoinTransactionRecord;
  pointsTransaction?: PointsTransactionRecord;
  senderWallet?: WalletBalance;
  hostWallet?: WalletBalance;
  hostPointsEarned?: number;
  sharePercent?: number;
}> {
  const {
    senderId,
    senderName,
    hostUserId,
    giftCoins,
    giftName,
    isPkBattle = false,
    referenceId,
    idempotencyKey,
  } = params;

  if (!senderId || !hostUserId || !Number.isInteger(giftCoins) || giftCoins <= 0) {
    return { success: false, code: 'INVALID_GIFT_TRANSFER', error: 'Invalid sender, host, or gift coin amount.' };
  }

  const coinIdemKey = idempotencyKey ? `${idempotencyKey}_coin` : null;
  const ptsIdemKey = idempotencyKey ? `${idempotencyKey}_pts` : null;

  return withTransaction(async (client) => {
    const rules = await getFinanceRules(client);
    const { pointsEarned, sharePercent } = await calculateHostShare(giftCoins, client);

    // 1. Idempotency check (prevents duplicate coin deductions OR duplicate points credits)
    if (coinIdemKey) {
      const existingCoin = (
        await client.query(`SELECT * FROM popolive.coin_transactions WHERE idempotency_key = $1`, [
          coinIdemKey,
        ])
      ).rows;
      if (existingCoin.length > 0) {
        const existingPts = ptsIdemKey
          ? (
              await client.query(`SELECT * FROM popolive.points_transactions WHERE idempotency_key = $1`, [
                ptsIdemKey,
              ])
            ).rows
          : [];
        const sWallet = await ensureWalletLocked(client, senderId, rules);
        const hWallet = await ensureWalletLocked(client, hostUserId, rules);
        return {
          success: existingCoin[0].status === 'completed',
          isDuplicate: true,
          coinTransaction: mapCoinTxRow(existingCoin[0]),
          pointsTransaction: existingPts[0] ? mapPointsTxRow(existingPts[0]) : undefined,
          senderWallet: mapWalletRow(sWallet, rules.hostGiftSharePercent),
          hostWallet: mapWalletRow(hWallet, rules.hostGiftSharePercent),
          hostPointsEarned: existingPts[0] ? parseInt(String(existingPts[0].points_amount), 10) : 0,
          sharePercent,
        };
      }
    }

    // 2. Deterministic ordered locking prevents deadlocks during high concurrency
    const orderedIds = Array.from(new Set([senderId, hostUserId])).sort();
    const lockedMap: Record<string, any> = {};
    for (const uid of orderedIds) {
      lockedMap[uid] = await ensureWalletLocked(client, uid, rules);
    }

    const senderRow = lockedMap[senderId];
    const hostRow = lockedMap[hostUserId];

    if (senderRow.is_frozen) {
      return { success: false, code: 'WALLET_FROZEN', error: 'Sender wallet is frozen.' };
    }

    const prevSenderCoins = parseInt(String(senderRow.coins), 10);

    // 3. Insufficient funds -> log failed coin txn cleanly inside TX and return without changing balances or crediting host
    if (prevSenderCoins < giftCoins) {
      const failTxId = generateTxId('TXN_COIN_FAIL');
      const failRows = (
        await client.query(
          `INSERT INTO popolive.coin_transactions (
             transaction_id, wallet_id, user_id, transaction_type, direction, coin_amount,
             previous_balance, new_balance, status, reference_id, idempotency_key, description, created_by
           ) VALUES ($1, $2, $3, 'gift_sent', 'debit', $4, $5, $5, 'failed', $6, $7, $8, 'gift_service')
           RETURNING *`,
          [
            failTxId,
            senderRow.wallet_id,
            senderId,
            giftCoins,
            prevSenderCoins,
            referenceId || null,
            coinIdemKey,
            `Failed gift (${giftName}): Insufficient coins (need ${giftCoins}, have ${prevSenderCoins})`,
          ]
        )
      ).rows;

      await emitWalletRealtimeEvent(client, senderId, 'wallet:transaction_failed', {
        ledger: 'coins',
        code: 'INSUFFICIENT_COINS',
        transaction: mapCoinTxRow(failRows[0]),
      });

      return {
        success: false,
        code: 'INSUFFICIENT_COINS',
        error: `Insufficient coin balance. Required: ${giftCoins}, available: ${prevSenderCoins}.`,
        coinTransaction: mapCoinTxRow(failRows[0]),
        senderWallet: mapWalletRow(senderRow, rules.hostGiftSharePercent),
      };
    }

    // 4. Deduct coins from sender
    const newSenderCoins = prevSenderCoins - giftCoins;
    const updatedSender = (
      await client.query(
        `UPDATE popolive.user_wallets
         SET coins = $1, total_spent_coins = total_spent_coins + $2, updated_at = NOW()
         WHERE user_id = $3
         RETURNING *`,
        [newSenderCoins, giftCoins, senderId]
      )
    ).rows[0];

    const coinTxId = generateTxId('TXN_COIN');
    const coinTxRow = (
      await client.query(
        `INSERT INTO popolive.coin_transactions (
           transaction_id, wallet_id, user_id, transaction_type, direction, coin_amount,
           previous_balance, new_balance, status, reference_id, idempotency_key, description, created_by
         ) VALUES ($1, $2, $3, 'gift_sent', 'debit', $4, $5, $6, 'completed', $7, $8, $9, 'gift_service')
         RETURNING *`,
        [
          coinTxId,
          senderRow.wallet_id,
          senderId,
          giftCoins,
          prevSenderCoins,
          newSenderCoins,
          referenceId || null,
          coinIdemKey,
          `Sent ${giftName} (${giftCoins} coins) to host ${hostUserId}`,
        ]
      )
    ).rows[0];

    // 5. Credit approved 70% host share points (strictly separate from coins; handles same-user edge cleanly by re-reading if needed)
    const freshHostPoints =
      senderId === hostUserId
        ? parseInt(String(updatedSender.diamond_points), 10)
        : parseInt(String(hostRow.diamond_points), 10);
    const newHostPoints = freshHostPoints + pointsEarned;

    const updatedHost = (
      await client.query(
        `UPDATE popolive.user_wallets
         SET diamond_points = $1, total_received_points = total_received_points + $2, updated_at = NOW()
         WHERE user_id = $3
         RETURNING *`,
        [newHostPoints, pointsEarned, hostUserId]
      )
    ).rows[0];

    const ptsTxId = generateTxId('TXN_PTS');
    const ptsTxRow = (
      await client.query(
        `INSERT INTO popolive.points_transactions (
           transaction_id, wallet_id, host_user_id, transaction_type, direction, points_amount,
           source_gift_coins, share_percentage_applied, gift_source, sender_id, sender_name,
           previous_balance, new_balance, status, reference_id, idempotency_key, description, created_by
         ) VALUES ($1, $2, $3, $4, 'credit', $5, $6, $7, $8, $9, $10, $11, $12, 'completed', $13, $14, $15, 'finance_engine')
         RETURNING *`,
        [
          ptsTxId,
          hostRow.wallet_id,
          hostUserId,
          isPkBattle ? 'pk_gift_earned' : 'gift_earned',
          pointsEarned,
          giftCoins,
          sharePercent,
          giftName,
          senderId,
          senderName,
          freshHostPoints,
          newHostPoints,
          referenceId || coinTxId,
          ptsIdemKey,
          `${sharePercent}% host share earned from ${giftName} (${giftCoins} coins)`,
        ]
      )
    ).rows[0];

    const mappedCoinTx = mapCoinTxRow(coinTxRow);
    const mappedPtsTx = mapPointsTxRow(ptsTxRow);
    const mappedSenderWallet = mapWalletRow(
      senderId === hostUserId ? updatedHost : updatedSender,
      rules.hostGiftSharePercent
    );
    const mappedHostWallet = mapWalletRow(updatedHost, rules.hostGiftSharePercent);

    await emitWalletRealtimeEvent(client, senderId, 'wallet:coin_balance_updated', {
      userId: senderId,
      coins: mappedSenderWallet.coins,
      previousBalance: prevSenderCoins,
      delta: -giftCoins,
      transactionId: coinTxId,
    });
    await emitWalletRealtimeEvent(client, hostUserId, 'wallet:points_balance_updated', {
      userId: hostUserId,
      points: mappedHostWallet.points,
      previousBalance: freshHostPoints,
      delta: pointsEarned,
      transactionId: ptsTxId,
    });
    await emitWalletRealtimeEvent(client, senderId, 'wallet:transaction_completed', {
      ledger: 'coins',
      transaction: mappedCoinTx,
    });

    if (params.onSuccessInTransaction) {
      await params.onSuccessInTransaction({
        client,
        coinTxRow,
        ptsTxRow,
        senderWallet: mappedSenderWallet,
        hostWallet: mappedHostWallet,
        hostPointsEarned: pointsEarned,
        sharePercent,
      });
    }

    return {
      success: true,
      coinTransaction: mappedCoinTx,
      pointsTransaction: mappedPtsTx,
      senderWallet: mappedSenderWallet,
      hostWallet: mappedHostWallet,
      hostPointsEarned: pointsEarned,
      sharePercent,
    };
  });
}

// =============================================================================
// 6. Paginated & Filterable History Queries
// =============================================================================

export async function getCoinHistory(
  userId: string,
  options: { page?: number; limit?: number; status?: string; type?: string; search?: string } = {}
) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const offset = (page - 1) * limit;

  const conditions = ['user_id = $1'];
  const params: any[] = [userId];

  if (options.status && ['pending', 'completed', 'failed', 'reversed'].includes(options.status)) {
    params.push(options.status);
    conditions.push(`status = $${params.length}`);
  }
  if (options.type && options.type !== 'all') {
    params.push(options.type);
    conditions.push(`transaction_type = $${params.length}`);
  }
  if (options.search) {
    params.push(`%${options.search}%`);
    conditions.push(`(transaction_id ILIKE $${params.length} OR COALESCE(reference_id, '') ILIKE $${params.length} OR COALESCE(description, '') ILIKE $${params.length})`);
  }

  const whereClause = conditions.join(' AND ');
  const countRows = await query(`SELECT COUNT(*)::int AS total FROM popolive.coin_transactions WHERE ${whereClause}`, params);
  const total = countRows[0]?.total ?? 0;

  const listParams = [...params, limit, offset];
  const rows = await query(
    `SELECT * FROM popolive.coin_transactions WHERE ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams
  );

  return {
    transactions: rows.map(mapCoinTxRow),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function getPointsHistory(
  hostUserId: string,
  options: { page?: number; limit?: number; status?: string; type?: string; search?: string; maskSender?: boolean } = {}
) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const offset = (page - 1) * limit;

  const conditions = ['host_user_id = $1'];
  const params: any[] = [hostUserId];

  if (options.status && ['pending', 'completed', 'failed', 'reversed'].includes(options.status)) {
    params.push(options.status);
    conditions.push(`status = $${params.length}`);
  }
  if (options.type && options.type !== 'all') {
    params.push(options.type);
    conditions.push(`transaction_type = $${params.length}`);
  }
  if (options.search) {
    params.push(`%${options.search}%`);
    conditions.push(`(transaction_id ILIKE $${params.length} OR gift_source ILIKE $${params.length} OR COALESCE(sender_name, '') ILIKE $${params.length})`);
  }

  const whereClause = conditions.join(' AND ');
  const countRows = await query(`SELECT COUNT(*)::int AS total FROM popolive.points_transactions WHERE ${whereClause}`, params);
  const total = countRows[0]?.total ?? 0;

  const listParams = [...params, limit, offset];
  const rows = await query(
    `SELECT * FROM popolive.points_transactions WHERE ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams
  );

  return {
    transactions: rows.map((r: any) => mapPointsTxRow(r, Boolean(options.maskSender))),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

// =============================================================================
// 7. Reversal & Finance Admin Adjustments (Linked Records, Audit Trail, RBAC)
// =============================================================================

export function isAuthorizedFinanceAdmin(actorRole?: string | null): boolean {
  return actorRole === 'finance_admin' || actorRole === 'super_admin';
}

export async function adminAdjustWalletBalance(params: {
  targetUserId: string;
  balanceType: BalanceType;
  operation: 'credit' | 'debit';
  amount: number;
  adminId: string;
  actorRole: string;
  reason: string;
  idempotencyKey?: string;
  ipAddress?: string;
  isPromotional?: boolean;
}) {
  const {
    targetUserId,
    balanceType,
    operation,
    amount,
    adminId,
    actorRole,
    reason,
    idempotencyKey,
    ipAddress = null,
    isPromotional = false,
  } = params;

  if (!isAuthorizedFinanceAdmin(actorRole)) {
    await logWalletAudit({
      targetUserId: targetUserId || 'unknown',
      actionType: 'unauthorized_balance_adjustment',
      actorId: adminId || 'unknown',
      actorRole: actorRole || 'none',
      reason: `Rejected unauthorized ${balanceType} adjustment attempt: ${reason || 'no reason'}`,
      balanceType,
      amount: amount || 0,
      ipAddress,
    });
    throw Object.assign(
      new Error('Forbidden: Only authorized finance_admin or super_admin may adjust wallet balances.'),
      { code: 'FINANCE_ADMIN_REQUIRED', status: 403 }
    );
  }

  if (!reason || reason.trim().length < 5) {
    throw Object.assign(new Error('Adjustment reason (minimum 5 characters) is mandatory.'), {
      code: 'REASON_REQUIRED',
      status: 400,
    });
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    throw Object.assign(new Error('Adjustment amount must be a positive integer.'), {
      code: 'INVALID_AMOUNT',
      status: 400,
    });
  }

  return withTransaction(async (client) => {
    const rules = await getFinanceRules(client);
    const walletRow = await ensureWalletLocked(client, targetUserId, rules);

    if (idempotencyKey) {
      const table = balanceType === 'coins' ? 'popolive.coin_transactions' : 'popolive.points_transactions';
      const existing = (await client.query(`SELECT * FROM ${table} WHERE idempotency_key = $1`, [idempotencyKey])).rows;
      if (existing.length > 0) {
        return {
          success: true,
          isDuplicate: true,
          wallet: mapWalletRow(walletRow, rules.hostGiftSharePercent),
          transaction: balanceType === 'coins' ? mapCoinTxRow(existing[0]) : mapPointsTxRow(existing[0]),
        };
      }
    }

    if (balanceType === 'coins') {
      const prevCoins = parseInt(String(walletRow.coins), 10);
      if (operation === 'debit' && prevCoins < amount) {
        throw Object.assign(
          new Error(`Cannot debit ${amount} coins: current balance is ${prevCoins}. Negative balance is forbidden.`),
          { code: 'NEGATIVE_BALANCE_FORBIDDEN', status: 400 }
        );
      }
      const newCoins = operation === 'credit' ? prevCoins + amount : prevCoins - amount;
      const updated = (
        await client.query(`UPDATE popolive.user_wallets SET coins = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *`, [
          newCoins,
          targetUserId,
        ])
      ).rows[0];

      const txId = generateTxId('TXN_ADM_C');
      const txRow = (
        await client.query(
          `INSERT INTO popolive.coin_transactions (
             transaction_id, wallet_id, user_id, transaction_type, direction, coin_amount,
             previous_balance, new_balance, status, reference_id, idempotency_key, description, metadata, created_by
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'completed', $9, $10, $11, $12::jsonb, $13)
           RETURNING *`,
          [
            txId,
            walletRow.wallet_id,
            targetUserId,
            operation === 'credit' ? 'admin_credit' : 'admin_debit',
            operation,
            amount,
            prevCoins,
            newCoins,
            `ADMIN:${adminId}`,
            idempotencyKey || null,
            `Finance Admin ${operation}: ${reason.trim()}`,
            JSON.stringify({ isPromotional: Boolean(isPromotional) }),
            adminId,
          ]
        )
      ).rows[0];

      // Module 7.8: Keep paid vs promotional coin pool synced for Wealth eligibility
      if (operation === 'credit') {
        const { recordCoinPoolCreditInTx } = await import('@/lib/recognition');
        await recordCoinPoolCreditInTx(client, {
          userId: targetUserId,
          paidCoins: isPromotional ? 0 : amount,
          promoCoins: isPromotional ? amount : 0,
          walletCoinsBefore: prevCoins,
          excludeTxId: txId,
        });
      } else {
        const { consumeCoinsFromPoolInTx } = await import('@/lib/recognition');
        await consumeCoinsFromPoolInTx(client, {
          userId: targetUserId,
          totalSpendCoins: amount,
          walletCoinsBeforeSpend: prevCoins,
          excludeFromWealth: true,
        });
      }

      await client.query(
        `INSERT INTO popolive.wallet_audit_logs (
           audit_id, target_user_id, wallet_id, action_type, actor_id, actor_role, reason,
           balance_type, amount, previous_balance, new_balance, reference_tx_id, ip_address
         ) VALUES ($1, $2, $3, 'admin_coin_adjustment', $4, $5, $6, 'coins', $7, $8, $9, $10, $11)`,
        [generateTxId('AUDIT'), targetUserId, walletRow.wallet_id, adminId, actorRole, reason.trim(), amount, prevCoins, newCoins, txId, ipAddress]
      );

      await emitWalletRealtimeEvent(client, targetUserId, 'wallet:coin_balance_updated', {
        userId: targetUserId,
        coins: newCoins,
        previousBalance: prevCoins,
        delta: operation === 'credit' ? amount : -amount,
        transactionId: txId,
      });

      return {
        success: true,
        wallet: mapWalletRow(updated, rules.hostGiftSharePercent),
        transaction: mapCoinTxRow(txRow),
      };
    } else {
      const prevPts = parseInt(String(walletRow.diamond_points), 10);
      if (operation === 'debit' && prevPts < amount) {
        throw Object.assign(
          new Error(`Cannot debit ${amount} points: current points balance is ${prevPts}.`),
          { code: 'NEGATIVE_BALANCE_FORBIDDEN', status: 400 }
        );
      }
      const newPts = operation === 'credit' ? prevPts + amount : prevPts - amount;
      const updated = (
        await client.query(
          `UPDATE popolive.user_wallets SET diamond_points = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *`,
          [newPts, targetUserId]
        )
      ).rows[0];

      const txId = generateTxId('TXN_ADM_P');
      const txRow = (
        await client.query(
          `INSERT INTO popolive.points_transactions (
             transaction_id, wallet_id, host_user_id, transaction_type, direction, points_amount,
             source_gift_coins, share_percentage_applied, gift_source, sender_id, sender_name,
             previous_balance, new_balance, status, reference_id, idempotency_key, description, created_by
           ) VALUES ($1, $2, $3, $4, $5, $6, 0, 100.00, 'Finance Adjustment', $7, $8, $9, $10, 'completed', $11, $12, $13, $14)
           RETURNING *`,
          [
            txId,
            walletRow.wallet_id,
            targetUserId,
            operation === 'credit' ? 'admin_credit' : 'admin_debit',
            operation,
            amount,
            adminId,
            `Finance Admin (${adminId})`,
            prevPts,
            newPts,
            `ADMIN:${adminId}`,
            idempotencyKey || null,
            `Finance Admin Points ${operation}: ${reason.trim()}`,
            adminId,
          ]
        )
      ).rows[0];

      await client.query(
        `INSERT INTO popolive.wallet_audit_logs (
           audit_id, target_user_id, wallet_id, action_type, actor_id, actor_role, reason,
           balance_type, amount, previous_balance, new_balance, reference_tx_id, ip_address
         ) VALUES ($1, $2, $3, 'admin_points_adjustment', $4, $5, $6, 'points', $7, $8, $9, $10, $11)`,
        [generateTxId('AUDIT'), targetUserId, walletRow.wallet_id, adminId, actorRole, reason.trim(), amount, prevPts, newPts, txId, ipAddress]
      );

      await emitWalletRealtimeEvent(client, targetUserId, 'wallet:points_balance_updated', {
        userId: targetUserId,
        points: newPts,
        previousBalance: prevPts,
        delta: operation === 'credit' ? amount : -amount,
        transactionId: txId,
      });

      return {
        success: true,
        wallet: mapWalletRow(updated, rules.hostGiftSharePercent),
        transaction: mapPointsTxRow(txRow),
      };
    }
  });
}

export async function reverseWalletTransaction(params: {
  transactionId: string;
  ledgerType: BalanceType;
  adminId: string;
  actorRole: string;
  reason: string;
  ipAddress?: string;
}) {
  const { transactionId, ledgerType, adminId, actorRole, reason, ipAddress = null } = params;

  if (!isAuthorizedFinanceAdmin(actorRole)) {
    throw Object.assign(
      new Error('Forbidden: Only authorized finance administrators may reverse transactions.'),
      { code: 'FINANCE_ADMIN_REQUIRED', status: 403 }
    );
  }

  if (!reason || reason.trim().length < 5) {
    throw Object.assign(new Error('Reversal reason (minimum 5 characters) is mandatory.'), {
      code: 'REASON_REQUIRED',
      status: 400,
    });
  }

  return withTransaction(async (client) => {
    const rules = await getFinanceRules(client);

    if (ledgerType === 'coins') {
      const origRows = (
        await client.query(`SELECT * FROM popolive.coin_transactions WHERE transaction_id = $1 FOR UPDATE`, [
          transactionId,
        ])
      ).rows;
      if (origRows.length === 0) {
        throw Object.assign(new Error('Original coin transaction not found.'), { code: 'TX_NOT_FOUND', status: 404 });
      }
      const orig = origRows[0];
      if (orig.status === 'reversed') {
        throw Object.assign(new Error('Transaction has already been reversed.'), { code: 'ALREADY_REVERSED', status: 400 });
      }
      if (orig.status !== 'completed') {
        throw Object.assign(new Error(`Only completed transactions can be reversed. Current status: ${orig.status}`), {
          code: 'TX_NOT_ELIGIBLE',
          status: 400,
        });
      }

      const walletRow = await ensureWalletLocked(client, orig.user_id, rules);
      const currCoins = parseInt(String(walletRow.coins), 10);
      const origAmount = parseInt(String(orig.coin_amount), 10);
      // Reverse a debit -> credit back; Reverse a credit -> debit back
      const revDirection: 'credit' | 'debit' = orig.direction === 'debit' ? 'credit' : 'debit';

      if (revDirection === 'debit' && currCoins < origAmount) {
        throw Object.assign(
          new Error(`Cannot reverse coin credit: user balance (${currCoins}) is less than ${origAmount}.`),
          { code: 'REVERSAL_WOULD_CAUSE_NEGATIVE_BALANCE', status: 400 }
        );
      }

      const newCoins = revDirection === 'credit' ? currCoins + origAmount : currCoins - origAmount;

      const updatedWallet = (
        await client.query(`UPDATE popolive.user_wallets SET coins = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *`, [
          newCoins,
          orig.user_id,
        ])
      ).rows[0];

      // Mark status = 'reversed' without modifying amount or historical balances
      await client.query(
        `UPDATE popolive.coin_transactions SET status = 'reversed', updated_at = NOW() WHERE transaction_id = $1`,
        [transactionId]
      );

      const revTxId = generateTxId('TXN_REV_C');
      const revRow = (
        await client.query(
          `INSERT INTO popolive.coin_transactions (
             transaction_id, wallet_id, user_id, transaction_type, direction, coin_amount,
             previous_balance, new_balance, status, reference_id, related_tx_id, description, created_by
           ) VALUES ($1, $2, $3, 'reversal', $4, $5, $6, $7, 'completed', $8, $9, $10, $11)
           RETURNING *`,
          [
            revTxId,
            walletRow.wallet_id,
            orig.user_id,
            revDirection,
            origAmount,
            currCoins,
            newCoins,
            `REVERSAL_OF:${transactionId}`,
            transactionId,
            `Reversal of ${transactionId}: ${reason.trim()}`,
            adminId,
          ]
        )
      ).rows[0];

      await client.query(
        `INSERT INTO popolive.wallet_audit_logs (
           audit_id, target_user_id, wallet_id, action_type, actor_id, actor_role, reason,
           balance_type, amount, previous_balance, new_balance, reference_tx_id, ip_address
         ) VALUES ($1, $2, $3, 'transaction_reversal', $4, $5, $6, 'coins', $7, $8, $9, $10, $11)`,
        [generateTxId('AUDIT'), orig.user_id, walletRow.wallet_id, adminId, actorRole, reason.trim(), origAmount, currCoins, newCoins, transactionId, ipAddress]
      );

      // Module 7.8: reverse any linked Wealth recognition entries when a wallet coin tx is reversed
      const { reverseRecognitionForSourceInTx } = await import('@/lib/recognition');
      await reverseRecognitionForSourceInTx(client, {
        sourceTxId: transactionId,
        reversalReason: reason.trim(),
        actorId: adminId,
      });

      // Module 7.9: if reversed transaction paid for a Store purchase, revoke linked inventory & equipment
      if (orig.reference_id && String(orig.reference_id).startsWith('STR_PUR')) {
        const purRevRows = await client.query(
          `UPDATE popolive.store_purchases
           SET status = 'reversed', updated_at = NOW()
           WHERE purchase_id = $1 AND status = 'completed'
           RETURNING purchase_id, inventory_id, user_id`,
          [String(orig.reference_id)]
        );
        for (const pr of purRevRows.rows || []) {
          if (pr.inventory_id) {
            await client.query(
              `UPDATE popolive.user_store_inventory
               SET status = 'revoked', is_equipped = FALSE, updated_at = NOW()
               WHERE inventory_id = $1`,
              [pr.inventory_id]
            );
            await client.query(
              `DELETE FROM popolive.user_store_equipment WHERE inventory_id = $1`,
              [pr.inventory_id]
            );
          }
        }
      }

      await emitWalletRealtimeEvent(client, orig.user_id, 'wallet:transaction_reversed', {
        ledger: 'coins',
        originalTransactionId: transactionId,
        reversalTransaction: mapCoinTxRow(revRow),
      });
      await emitWalletRealtimeEvent(client, orig.user_id, 'wallet:coin_balance_updated', {
        userId: orig.user_id,
        coins: newCoins,
        previousBalance: currCoins,
        delta: revDirection === 'credit' ? origAmount : -origAmount,
        transactionId: revTxId,
      });

      return {
        success: true,
        reversalTransaction: mapCoinTxRow(revRow),
        wallet: mapWalletRow(updatedWallet, rules.hostGiftSharePercent),
      };
    } else {
      const origRows = (
        await client.query(`SELECT * FROM popolive.points_transactions WHERE transaction_id = $1 FOR UPDATE`, [
          transactionId,
        ])
      ).rows;
      if (origRows.length === 0) {
        throw Object.assign(new Error('Original points transaction not found.'), { code: 'TX_NOT_FOUND', status: 404 });
      }
      const orig = origRows[0];
      if (orig.status === 'reversed') {
        throw Object.assign(new Error('Transaction has already been reversed.'), { code: 'ALREADY_REVERSED', status: 400 });
      }
      if (orig.status !== 'completed') {
        throw Object.assign(new Error(`Only completed transactions can be reversed. Current status: ${orig.status}`), {
          code: 'TX_NOT_ELIGIBLE',
          status: 400,
        });
      }

      const walletRow = await ensureWalletLocked(client, orig.host_user_id, rules);
      const currPts = parseInt(String(walletRow.diamond_points), 10);
      const origPts = parseInt(String(orig.points_amount), 10);
      const revDirection: 'credit' | 'debit' = orig.direction === 'credit' ? 'debit' : 'credit';

      if (revDirection === 'debit' && currPts < origPts) {
        throw Object.assign(
          new Error(`Cannot reverse points credit: host points (${currPts}) is less than ${origPts}.`),
          { code: 'REVERSAL_WOULD_CAUSE_NEGATIVE_BALANCE', status: 400 }
        );
      }

      const newPts = revDirection === 'credit' ? currPts + origPts : currPts - origPts;
      const updatedWallet = (
        await client.query(
          `UPDATE popolive.user_wallets SET diamond_points = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *`,
          [newPts, orig.host_user_id]
        )
      ).rows[0];

      await client.query(
        `UPDATE popolive.points_transactions SET status = 'reversed', updated_at = NOW() WHERE transaction_id = $1`,
        [transactionId]
      );

      const revTxId = generateTxId('TXN_REV_P');
      const revRow = (
        await client.query(
          `INSERT INTO popolive.points_transactions (
             transaction_id, wallet_id, host_user_id, transaction_type, direction, points_amount,
             source_gift_coins, share_percentage_applied, gift_source, sender_id, sender_name,
             previous_balance, new_balance, status, reference_id, related_tx_id, description, created_by
           ) VALUES ($1, $2, $3, 'reversal', $4, $5, $6, $7, $8, $9, $10, $11, $12, 'completed', $13, $14, $15, $16)
           RETURNING *`,
          [
            revTxId,
            walletRow.wallet_id,
            orig.host_user_id,
            revDirection,
            origPts,
            orig.source_gift_coins,
            orig.share_percentage_applied,
            orig.gift_source,
            adminId,
            `Finance Reversal`,
            currPts,
            newPts,
            `REVERSAL_OF:${transactionId}`,
            transactionId,
            `Reversal of ${transactionId}: ${reason.trim()}`,
            adminId,
          ]
        )
      ).rows[0];

      await client.query(
        `INSERT INTO popolive.wallet_audit_logs (
           audit_id, target_user_id, wallet_id, action_type, actor_id, actor_role, reason,
           balance_type, amount, previous_balance, new_balance, reference_tx_id, ip_address
         ) VALUES ($1, $2, $3, 'transaction_reversal', $4, $5, $6, 'points', $7, $8, $9, $10, $11)`,
        [generateTxId('AUDIT'), orig.host_user_id, walletRow.wallet_id, adminId, actorRole, reason.trim(), origPts, currPts, newPts, transactionId, ipAddress]
      );

      await emitWalletRealtimeEvent(client, orig.host_user_id, 'wallet:transaction_reversed', {
        ledger: 'points',
        originalTransactionId: transactionId,
        reversalTransaction: mapPointsTxRow(revRow),
      });
      await emitWalletRealtimeEvent(client, orig.host_user_id, 'wallet:points_balance_updated', {
        userId: orig.host_user_id,
        points: newPts,
        previousBalance: currPts,
        delta: revDirection === 'credit' ? origPts : -origPts,
        transactionId: revTxId,
      });

      return {
        success: true,
        reversalTransaction: mapPointsTxRow(revRow),
        wallet: mapWalletRow(updatedWallet, rules.hostGiftSharePercent),
      };
    }
  });
}

// =============================================================================
// 8. Admin Finance Queries & Audit Logging
// =============================================================================

export async function logWalletAudit(params: {
  targetUserId: string;
  walletId?: string | null;
  actionType: string;
  actorId: string;
  actorRole: string;
  reason: string;
  balanceType?: 'coins' | 'points' | 'both' | 'none';
  amount?: number;
  ipAddress?: string | null;
}): Promise<void> {
  try {
    await query(
      `INSERT INTO popolive.wallet_audit_logs (
         audit_id, target_user_id, wallet_id, action_type, actor_id, actor_role, reason,
         balance_type, amount, ip_address
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        generateTxId('AUDIT'),
        params.targetUserId,
        params.walletId || null,
        params.actionType,
        params.actorId,
        params.actorRole,
        params.reason,
        params.balanceType || 'none',
        params.amount || 0,
        params.ipAddress || null,
      ]
    );
  } catch (err) {
    console.warn('logWalletAudit non-fatal error:', err);
  }
}

export async function adminSearchWallets(search: string = '', page: number = 1, limit: number = 25) {
  const offset = (Math.max(1, page) - 1) * limit;
  const rules = await getFinanceRules();
  const params: any[] = [];
  let where = '1=1';

  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    where = `(user_id ILIKE $1 OR CAST(wallet_id AS TEXT) ILIKE $1)`;
  }

  const totalRows = await query(`SELECT COUNT(*)::int AS total FROM popolive.user_wallets WHERE ${where}`, params);
  const rows = await query(
    `SELECT * FROM popolive.user_wallets WHERE ${where}
     ORDER BY updated_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return {
    wallets: rows.map((r: any) => mapWalletRow(r, rules.hostGiftSharePercent)),
    total: totalRows[0]?.total ?? 0,
  };
}

export async function adminQueryAuditLogs(filters: { targetUserId?: string; limit?: number } = {}) {
  const limit = Math.min(100, Math.max(1, filters.limit || 50));
  const params: any[] = [];
  let where = '1=1';

  if (filters.targetUserId) {
    params.push(`%${filters.targetUserId}%`);
    where = `target_user_id ILIKE $1`;
  }

  const rows = await query(
    `SELECT * FROM popolive.wallet_audit_logs WHERE ${where}
     ORDER BY created_at DESC LIMIT $${params.length + 1}`,
    [...params, limit]
  );

  return rows.map((r: any) => ({
    id: r.id,
    auditId: r.audit_id,
    targetUserId: r.target_user_id,
    walletId: r.wallet_id,
    actionType: r.action_type,
    actorId: r.actor_id,
    actorRole: r.actor_role,
    reason: r.reason,
    balanceType: r.balance_type,
    amount: parseInt(String(r.amount ?? '0'), 10),
    previousBalance: r.previous_balance !== null ? parseInt(String(r.previous_balance), 10) : null,
    newBalance: r.new_balance !== null ? parseInt(String(r.new_balance), 10) : null,
    referenceTxId: r.reference_tx_id,
    ipAddress: r.ip_address,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : '',
  })) as WalletAuditLogRecord[];
}
